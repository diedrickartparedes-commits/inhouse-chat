import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
export async function POST(request: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  const { groupId } = await request.json();
  const group = await db.group.findUnique({ where: { id: groupId } });
  if (!group || group.isDefault) return NextResponse.json({ error: "That group is unavailable." }, { status: 404 });
  await db.membership.upsert({ where: { userId_groupId: { userId: user.id, groupId } }, update: {}, create: { userId: user.id, groupId, status: "PENDING" } });
  return NextResponse.json({ ok: true, status: "PENDING" });
}
