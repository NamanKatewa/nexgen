import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";

import { authRouter } from "~/server/api/routers/auth";
import { kycRouter } from "~/server/api/routers/kyc";
import { adminRouter } from "~/server/api/routers/admin";

// Combine routers
export const appRouter = createTRPCRouter({
  auth: authRouter,
  kyc: kycRouter,
  admin: adminRouter,
});

export type AppRouter = typeof appRouter;

// Export caller factory
export const createCaller = createCallerFactory(appRouter);
