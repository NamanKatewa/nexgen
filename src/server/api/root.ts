import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";
import { authRouter } from "~/server/api/routers/auth";
import { kycRouter } from "./routers/kyc";

export const appRouter = createTRPCRouter({
  auth: authRouter,
  kyc: kycRouter,
});

export type AppRouter = typeof appRouter;

export const createCaller = createCallerFactory(appRouter);
