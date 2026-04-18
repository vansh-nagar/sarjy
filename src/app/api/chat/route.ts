import { NextResponse, NextRequest } from "next/server";
import { generateText, tool, stepCountIs } from "ai";
import { groq } from "@ai-sdk/groq";
import z from "zod";
import axios from "axios";

export const POST = async (req: NextRequest) => {
  try {
    const { message, memoryContext, messages = [] } = await req.json();

    if (!message) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

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
            city: z
              .string()
              .describe("The city name to get weather for"),
          }),
          execute: async ({ city }) => {
            try {
              const response = await fetch(
                `https://wttr.in/${encodeURIComponent(city)}?format=j1`
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
                description:
                  current.weatherDesc?.[0]?.value || "Unknown",
                windSpeed: current.windspeedKmph,
                windDir: current.winddir16Point,
                uvIndex: current.uvIndex,
              };
            } catch (err) {
              console.error("Weather tool error:", err);
              return {
                error:
                  "Failed to fetch weather data. Please try again.",
              };
            }
          },
        }),
        getCurrentTime: tool({
          description: "Get current time.",
          inputSchema: z.object({}),
          execute: async () => ({
            time: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata" }),
            date: new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric", timeZone: "Asia/Kolkata" }),
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

${memoryContext ? memoryContext : "No user memory available yet."}

Your capabilities:
1. **Weather** — You can check weather for any city using the getWeather tool.
2. **Memory** — The user tells you facts about themselves (name, city, favorite color, preferences). Acknowledge when they share info. When they ask "what's my name?" or similar, refer to the memory context above.
3. **Time** — You can tell the current time and date using the getCurrentTime tool.
4. **Chat** — You love having natural conversations about anything.

Rules:
- Always respond in plain text — no markdown, no bullet points, no headers. This is spoken aloud.
- Keep responses concise and natural for voice output.
- When the user shares personal info (name, city, color, preferences), acknowledge it warmly.
- When the user asks about their stored info and it's in the memory context, recall it confidently.
- If memory context has the user's city and they ask about weather without specifying a city, use their remembered city.
- Be genuinely helpful and make the user feel heard.
- Never say "I'm an AI" or "as an AI" — just be Sarjy.`,
    });

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
            <voice xml:lang='en-US' xml:gender='Female' name='en-US-JennyMultilingualNeural'>
              ${cleanText}
            </voice>
          </speak>`,
          responseType: "arraybuffer",
        });

        const audioBuffer = ttsResponse.data;
        audio = Buffer.from(audioBuffer).toString("base64"); // binary to buffer
      } catch (ttsError) {
        console.error("TTS error:", ttsError);
      }
    }

    console.log("Sarjy response:", text);

    return NextResponse.json({ reply: text, audio }, { status: 200 });
  } catch (error: any) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: error.message || "Something went wrong" },
      { status: 500 }
    );
  }
};
