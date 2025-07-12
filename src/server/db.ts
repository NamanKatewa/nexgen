import { PrismaClient } from "@prisma/client";

import { env } from "~/env";
import logger from "~/lib/logger";

const createPrismaClient = () => {
	logger.info("Initializing Prisma Client...");
	return new PrismaClient({
		log:
			env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
	});
};

const globalForPrisma = globalThis as unknown as {
	prisma: ReturnType<typeof createPrismaClient> | undefined;
};

export const db = globalForPrisma.prisma ?? createPrismaClient();

if (env.NODE_ENV !== "production") {
	globalForPrisma.prisma = db;
	logger.info("Prisma Client assigned to global object (development mode).");
}

logger.info("Database connection established.");
