import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db, ensureDefaultGroup } from "@/lib/db";
import { setSession } from "@/lib/auth";
import { ADMIN_USERNAME, ADMIN_PASSWORD } from "@/lib/admin";

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();
    if (typeof username !== "string" || typeof password !== "string") return NextResponse.json({ error: "Enter your username and password." }, { status: 400 });
    let user = await db.user.findUnique({ where: { username } });
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      await ensureDefaultGroup();
      const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);
      user = await db.user.upsert({ where: { username: ADMIN_USERNAME }, update: { passwordHash, isAdmin: true }, create: { username: ADMIN_USERNAME, passwordHash, isAdmin: true } });
      const commons = await db.group.findUniqueOrThrow({ where: { name: "Commons" } });
      await db.membership.upsert({ where: { userId_groupId: { userId: user.id, groupId: commons.id } }, update: { status: "APPROVED" }, create: { userId: user.id, groupId: commons.id, status: "APPROVED" } });
    } else if (user && !(await bcrypt.compare(password, user.passwordHash))) user = null;
    if (!user) return NextResponse.json({ error: "Username or password is incorrect." }, { status: 401 });
    await setSession(user.id);
    return NextResponse.json({ user: { id: user.id, username: user.username, isAdmin: user.isAdmin } });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Could not sign in. Check the database setup." }, { status: 500 });
  }
}
