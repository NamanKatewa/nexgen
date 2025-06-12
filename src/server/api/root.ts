import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";
import { helloRouter } from "~/server/api/routers/hello";

export const appRouter = createTRPCRouter({
  hello: helloRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

export const createCaller = createCallerFactory(appRouter);
