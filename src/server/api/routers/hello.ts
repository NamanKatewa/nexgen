import { createTRPCRouter, publicProcedure } from "../trpc";

export const helloRouter = createTRPCRouter({
  hello: publicProcedure.mutation(async ({ input }) => {
    return { message: "hello" };
  }),
});
