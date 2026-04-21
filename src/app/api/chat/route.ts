import { NextResponse, NextRequest } from "next/server";
import { generateText, tool, stepCountIs } from "ai";
import { groq } from "@ai-sdk/groq";
import z from "zod";
import axios from "axios";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import { redis } from "@/lib/redis";

const REDIS_TTL = 3600;

export const POST = async (req: NextRequest) => {
  try {
    const {
      message,
      sessionId,
      messages = [],
      voice = "en-US-JennyMultilingualNeural",
    } = await req.json();

    if (!message) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 },
      );
    }
    if (!sessionId) {
      return NextResponse.json(
        { error: "sessionId is required" },
        { status: 400 },
      );
    }

    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in to chat." },
        { status: 401 },
      );
    }

    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    const name = [user.firstName, user.lastName].filter(Boolean).join(" ");
    const email = user.emailAddresses?.[0]?.emailAddress;
    const userContext = `\nThe authenticated user's details:\n- Name: ${name || "Unknown"}\n- Email: ${email || "Unknown"}\n- ID: ${user.id}\nTreat this user warmly and address them by name if appropriate.`;

    await prisma.user.upsert({
      where: { id: userId },
      update: { name: name || "Unknown", email: email || "" },
      create: { id: userId, name: name || "Unknown", email: email || "" },
    });

    const pastMessages = await prisma.message.findMany({
      where: {
        session: { userId },
        sessionId: { not: sessionId },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: { role: true, content: true },
    });

    const memoryContext =
      pastMessages.length > 0
        ? "Memory from previous sessions:\n" +
          pastMessages
            .reverse()
            .map((m) => `${m.role}: ${m.content}`)
            .join("\n")
        : null;

    const conversationMessages = [
      ...messages.map((m: { role: string; content: string }) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
      { role: "user" as const, content: message },
    ];

    const { text } = await generateText({
      model: groq("openai/gpt-oss-120b"),
      messages: conversationMessages,
      tools: {
        getWeather: tool({
          description:
            "Get the current weather for a given city. Use this whenever the user asks about weather, temperature, or forecast.",
          inputSchema: z.object({
            city: z.string().describe("The city name to get weather for"),
          }),
          execute: async ({ city }) => {
            try {
              const response = await fetch(
                `https://wttr.in/${encodeURIComponent(city)}?format=j1`,
              );
              if (!response.ok) throw new Error("Weather API failed");
              const data = await response.json();
              const current = data.current_condition?.[0];
              const area = data.nearest_area?.[0];
              if (!current) return { error: "No weather data found" };
              return {
                city: area?.areaName?.[0]?.value || city,
                region: area?.region?.[0]?.value || "",
                country: area?.country?.[0]?.value || "",
                temperature: current.temp_C,
                feelsLike: current.FeelsLikeC,
                humidity: current.humidity,
                description: current.weatherDesc?.[0]?.value || "Unknown",
                windSpeed: current.windspeedKmph,
                windDir: current.winddir16Point,
                uvIndex: current.uvIndex,
              };
            } catch (err) {
              console.error("Weather tool error:", err);
              return {
                error: "Failed to fetch weather data. Please try again.",
              };
            }
          },
        }),
        getCurrentTime: tool({
          description: "Get current time.",
          inputSchema: z.object({}),
          execute: async () => ({
            time: new Date().toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
              timeZone: "Asia/Kolkata",
            }),
            date: new Date().toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
              year: "numeric",
              timeZone: "Asia/Kolkata",
            }),
          }),
        }),
      },
      stopWhen: stepCountIs(5),
      system: `You are Sarjy, a real-time personal voice companion.

Your personality:
- Warm, friendly, and natural — never robotic or overly formal.
- Concise but helpful — keep responses short and voice-friendly (2-3 sentences max unless explaining something).
- You remember user info and reference it naturally.
- You have a bit of personality — you can be playful, enthusiastic, and empathetic.

${memoryContext ?? "No previous session memory available."}
${userContext}

Your capabilities:
1. **Weather** — You can check weather for any city using the getWeather tool.
2. **Memory** — The user tells you facts about themselves (name, city, favorite color, preferences). Acknowledge when they share info. When they ask "what's my name?" or similar, refer to the memory context above.
3. **Time** — You can tell the current time and date using the getCurrentTime tool.
4. **Chat** — You love having natural conversations about anything.

Rules:
- Always respond in plain text — no markdown, no bullet points, no headers. This is spoken aloud.
- STRICT LENGTH LIMIT: Keep every response to 1-4 sentences maximum. Never exceed 4 sentences under any circumstance. Long responses cause bad voice output and waste tokens — there are no exceptions to this rule.
- When the user shares personal info (name, city, color, preferences), acknowledge it warmly in one sentence.
- When the user asks about their stored info and it's in the memory context, recall it confidently.
- If memory context has the user's city and they ask about weather without specifying a city, use their remembered city.
- Be genuinely helpful and make the user feel heard.
- Never say "I'm an AI" or "as an AI" — just be Sarjy.`,
    });

    await prisma.message.createMany({
      data: [
        { sessionId, role: "user", content: message },
        { sessionId, role: "assistant", content: text },
      ],
    });

    await prisma.session.update({
      where: { id: sessionId },
      data: { updatedAt: new Date() },
    });

    const cacheKey = `session:${sessionId}`;
    const cached = await redis.get(cacheKey);
    if (cached) {
      const existing = JSON.parse(cached) as {
        role: string;
        content: string;
      }[];
      existing.push({ role: "user", content: message });
      existing.push({ role: "assistant", content: text });
      await redis.set(cacheKey, JSON.stringify(existing), "EX", REDIS_TTL);
    }

    const AZURE_KEY = process.env.AZURE_SPEECH_KEY;
    const AZURE_REGION = process.env.AZURE_SPEECH_REGION;
    let audio: string | null = null;

    if (AZURE_KEY && AZURE_REGION && text) {
      try {
        const cleanText = text
          .replace(/[*#_~`]/g, "")
          .replace(/\n+/g, ". ")
          .replace(/\s+/g, " ")
          .trim();

        const ttsResponse = await axios({
          method: "post",
          url: `https://${AZURE_REGION}.tts.speech.microsoft.com/cognitiveservices/v1`,
          headers: {
            "Ocp-Apim-Subscription-Key": AZURE_KEY,
            "Content-Type": "application/ssml+xml",
            "X-Microsoft-OutputFormat": "audio-16khz-32kbitrate-mono-mp3",
          },
          data: `<speak version='1.0' xml:lang='en-US'>
            <voice xml:lang='en-US' name='${voice}'>
              ${cleanText}
            </voice>
          </speak>`,
          responseType: "arraybuffer",
        });

        audio = Buffer.from(ttsResponse.data).toString("base64");
      } catch (ttsError) {
        console.error("TTS error:", ttsError);
      }
    }

    return NextResponse.json({ reply: text, audio }, { status: 200 });
  } catch (error: any) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: error.message || "Something went wrong" },
      { status: 500 },
    );
  }
};
