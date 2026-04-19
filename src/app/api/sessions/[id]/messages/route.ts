import { NextResponse, NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import { redis } from "@/lib/redis";

const REDIS_TTL = 3600;

export const GET = async (
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: sessionId } = await params;

  const session = await prisma.session.findFirst({
    where: { id: sessionId, userId },
    select: { id: true },
  });
  if (!session) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const cacheKey = `session:${sessionId}`;
  const cached = await redis.get(cacheKey);

  if (cached) {
    return NextResponse.json({ messages: JSON.parse(cached) });
  }

  const messages = await prisma.message.findMany({
    where: { sessionId },
    orderBy: { createdAt: "asc" },
    select: { id: true, role: true, content: true, createdAt: true },
  });

  await redis.set(cacheKey, JSON.stringify(messages), "EX", REDIS_TTL);

  return NextResponse.json({ messages });
};
