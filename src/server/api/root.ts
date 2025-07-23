import { authRouter } from "~/server/api/routers/auth";
import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";
import { addressRouter } from "./routers/address";
import { adminRouter } from "./routers/admin";
import { kycRouter } from "./routers/kyc";
import { labelRouter } from "./routers/label";
import { rateRouter } from "./routers/rate";
import { refundRouter } from "./routers/refund";
import { shipmentRouter } from "./routers/shipment";
import { supportRouter } from "./routers/support";
import { trackingRouter } from "./routers/tracking";
import { walletRouter } from "./routers/wallet";
import { exportRouter } from '~/server/api/routers/export';

export const appRouter = createTRPCRouter({
	auth: authRouter,
	kyc: kycRouter,
	admin: adminRouter,
	wallet: walletRouter,
	address: addressRouter,
	shipment: shipmentRouter,
	rate: rateRouter,
	label: labelRouter,
	tracking: trackingRouter,
	support: supportRouter,
	refund: refundRouter,
    export: exportRouter,
});

export type AppRouter = typeof appRouter;

export const createCaller = createCallerFactory(appRouter);
