import { NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";

export const GET = async () => {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sessions = await prisma.session.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    select: { id: true, title: true, createdAt: true, updatedAt: true },
  });

  return NextResponse.json({ sessions });
};

export const POST = async (req: Request) => {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const title: string = body.title?.trim() || "New Chat";

  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  const name = [user.firstName, user.lastName].filter(Boolean).join(" ");
  const email = user.emailAddresses?.[0]?.emailAddress ?? "";

  await prisma.user.upsert({
    where: { id: userId },
    update: { name: name || "Unknown", email },
    create: { id: userId, name: name || "Unknown", email },
  });

  const session = await prisma.session.create({
    data: { userId, title },
    select: { id: true, title: true, createdAt: true, updatedAt: true },
  });

  return NextResponse.json({ session });
};
