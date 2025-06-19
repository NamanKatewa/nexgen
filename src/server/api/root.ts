import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";
import { authRouter } from "~/server/api/routers/auth";
import { kycRouter } from "./routers/kyc";
import { adminRouter } from "./routers/admin";
import { walletRouter } from "./routers/wallet";

export const appRouter = createTRPCRouter({
  auth: authRouter,
  kyc: kycRouter,
  admin: adminRouter,
  wallet: walletRouter,
});

export type AppRouter = typeof appRouter;

export const createCaller = createCallerFactory(appRouter);
