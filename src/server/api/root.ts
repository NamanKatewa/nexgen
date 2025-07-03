import { authRouter } from "~/server/api/routers/auth";
import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";
import { addressRouter } from "./routers/address";
import { adminRouter } from "./routers/admin";
import { kycRouter } from "./routers/kyc";
import { orderRouter } from "./routers/order";
import { walletRouter } from "./routers/wallet";
import { rateRouter } from "./routers/rate";

export const appRouter = createTRPCRouter({
  auth: authRouter,
  kyc: kycRouter,
  admin: adminRouter,
  wallet: walletRouter,
  address: addressRouter,
  order: orderRouter,
  rate: rateRouter,
});

export type AppRouter = typeof appRouter;

export const createCaller = createCallerFactory(appRouter);
