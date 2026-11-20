import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
type Context = { params: Promise<{ groupId: string }> };
export async function GET(_request: Request, { params }: Context) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  const { groupId } = await params;
  const membership = await db.membership.findUnique({ where: { userId_groupId: { userId: user.id, groupId } } });
  if (!membership || membership.status !== "APPROVED") return NextResponse.json({ error: "You are not a member of this group." }, { status: 403 });
  const messages = await db.message.findMany({ where: { groupId }, orderBy: { createdAt: "asc" }, take: 200, include: { user: { select: { username: true } } } });
  return NextResponse.json({ messages });
}
export async function POST(request: Request, { params }: Context) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  const { groupId } = await params;
  const membership = await db.membership.findUnique({ where: { userId_groupId: { userId: user.id, groupId } } });
  if (!membership || membership.status !== "APPROVED") return NextResponse.json({ error: "You are not a member of this group." }, { status: 403 });
  const { text } = await request.json();
  if (typeof text !== "string" || !text.trim() || text.length > 2000) return NextResponse.json({ error: "Messages must be 1–2,000 characters." }, { status: 400 });
  const message = await db.message.create({ data: { text: text.trim(), groupId, userId: user.id }, include: { user: { select: { username: true } } } });
  return NextResponse.json({ message }, { status: 201 });
}
