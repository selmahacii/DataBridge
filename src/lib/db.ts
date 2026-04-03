import { PrismaClient } from "@prisma/client";

// Prisma recommends this pattern to avoid exhausting db connections in dev
// when Next.js hot-reloads modules.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const db = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;

export default db;
