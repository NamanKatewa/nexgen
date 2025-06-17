import { PrismaClient } from "@prisma/client";
import { env } from "~/env";

// Use function-level scope for instantiation logic
const createPrismaClient = () =>
  new PrismaClient({
    log:
      env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

// Use a globalThis property to store the Prisma client in dev
const globalForPrisma = globalThis as typeof globalThis & {
  prisma?: PrismaClient;
};

// Memoize Prisma client — reused in dev, fresh in prod
export const db = globalForPrisma.prisma ?? createPrismaClient();

if (env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
