import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
export async function POST(request: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  if (!user.isAdmin) return NextResponse.json({ error: "Only the admin can approve members." }, { status: 403 });
  const { membershipId, approve } = await request.json();
  const membership = await db.membership.findUnique({ where: { id: membershipId } });
  if (!membership || membership.status !== "PENDING") return NextResponse.json({ error: "Request not found." }, { status: 404 });
  if (approve) await db.membership.update({ where: { id: membership.id }, data: { status: "APPROVED" } });
  else await db.membership.delete({ where: { id: membership.id } });
  return NextResponse.json({ ok: true });
}
