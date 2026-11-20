import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { db, ensureDefaultGroup } from "@/lib/db";

export async function GET() {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  await ensureDefaultGroup();
  const groups = await db.group.findMany({ orderBy: [{ isDefault: "desc" }, { name: "asc" }], include: { memberships: { where: { userId: user.id }, select: { status: true } }, _count: { select: { memberships: { where: { status: "APPROVED" } } } } } });
  return NextResponse.json({ groups: groups.map(({ memberships, _count, ...g }) => ({ ...g, memberCount: _count.memberships, myStatus: memberships[0]?.status ?? null })) });
}

export async function POST(request: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  if (!user.isAdmin) return NextResponse.json({ error: "Only the admin can create groups." }, { status: 403 });
  const { name, description } = await request.json();
  if (typeof name !== "string" || !/^[\p{L}\p{N} _-]{2,32}$/u.test(name.trim())) return NextResponse.json({ error: "Group names must be 2–32 characters." }, { status: 400 });
  try { const group = await db.group.create({ data: { name: name.trim(), description: typeof description === "string" ? description.trim().slice(0, 140) : "", memberships: { create: { userId: user.id, status: "APPROVED" } } } }); return NextResponse.json({ group }, { status: 201 }); }
  catch { return NextResponse.json({ error: "That group name is already in use." }, { status: 409 }); }
}
