import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };
export const db = globalForPrisma.prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;

export async function ensureDefaultGroup() {
  await db.group.upsert({ where: { name: "Commons" }, update: {}, create: { name: "Commons", description: "The shared room for everyone.", isDefault: true } });
}
