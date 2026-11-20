import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
export async function GET() {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  if (!user.isAdmin) return NextResponse.json({ error: "Admin only." }, { status: 403 });
  const requests = await db.membership.findMany({ where: { status: "PENDING" }, include: { user: { select: { username: true } }, group: { select: { name: true } } }, orderBy: { createdAt: "asc" } });
  return NextResponse.json({ requests });
}
