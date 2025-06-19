import { addFundsSchema, paymentSuccessSchema } from "~/schemas/wallet";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { db } from "~/server/db";
import { nanoid } from "nanoid";
import { createIMBPaymentOrder } from "~/lib/imb";
import { env } from "~/env";
import { TRPCError } from "@trpc/server";

export const walletRouter = createTRPCRouter({
  addFunds: protectedProcedure
    .input(addFundsSchema)
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user) return null;

      const user = await db.user.findUnique({
        where: { user_id: ctx.user.user_id },
        include: { wallet: { select: { wallet_id: true } } },
      });

      if (!user) return null;
      if (!user.wallet) return null;

      const orderId = `wallet_${ctx.user.user_id}_${nanoid(8)}`;

      try {
        const transaction = await db.transaction.create({
          data: {
            wallet: { connect: { wallet_id: user.wallet?.wallet_id } },
            user: { connect: { user_id: user.user_id } },
            transaction_type: "Credit",
            payment_status: "Pending",
            transaction_date: new Date(Date.now()),
            amount: input.amount,
          },
        });

        const redirectUrl = `${
          ctx.headers.get("x-forwarded-proto") ?? "http"
        }://${ctx.headers.get("host")}/dashboard/wallet/callback?id=${
          transaction.transaction_id
        }`;

        const imbResponse = await createIMBPaymentOrder({
          customer_mobile: user.mobile_number,
          user_token: env.IMB_TOKEN,
          amount: input.amount,
          order_id: orderId,
          redirect_url: redirectUrl,
          remark1: user.email,
        });

        return {
          paymentUrl: imbResponse.result.payment_url,
        };
      } catch (error) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: (error as Error).message,
        });
      }
    }),
  updateTransaction: protectedProcedure
    .input(paymentSuccessSchema)
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user) return null;

      const user = await db.user.findUnique({
        where: { user_id: ctx.user.user_id },
        include: { wallet: { select: { wallet_id: true } } },
      });

      if (!user) return null;

      await db.transaction.update({
        where: { transaction_id: input.transaction_id, user_id: user.user_id },
        data: {
          payment_status: "Completed",
        },
      });

      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);

      await db.transaction.deleteMany({
        where: {
          payment_status: "Pending",
          transaction_date: {
            lt: tenMinutesAgo,
          },
        },
      });
    }),
});
