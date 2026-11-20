import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";
import { db, ensureDefaultGroup } from "@/lib/db";
import { setSession } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const { username } = await request.json();
    if (typeof username !== "string" || !/^[a-zA-Z0-9_]{3,20}$/.test(username)) return NextResponse.json({ error: "Use 3–20 letters, numbers, or underscores for your username." }, { status: 400 });
    await ensureDefaultGroup();
    if (await db.user.findUnique({ where: { username } })) return NextResponse.json({ error: "That username is already taken." }, { status: 409 });
    const temporaryPassword = randomBytes(6).toString("base64url").slice(0, 10);
    const user = await db.user.create({ data: { username, passwordHash: await bcrypt.hash(temporaryPassword, 12), memberships: { create: { group: { connect: { name: "Commons" } }, status: "APPROVED" } } } });
    await setSession(user.id);
    return NextResponse.json({ user: { id: user.id, username: user.username, isAdmin: false }, temporaryPassword }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Could not create account. Check the database setup." }, { status: 500 });
  }
}
