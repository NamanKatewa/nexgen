import { TRPCError } from "@trpc/server";
import { nanoid } from "nanoid";
import { env } from "~/env";
import { createIMBPaymentOrder } from "~/lib/imb";
import { addFundsSchema, paymentSuccessSchema } from "~/schemas/wallet";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { db } from "~/server/db";

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
				include: { wallet: { select: { wallet_id: true, balance: true } } },
			});

			if (!user) return null;
			if (!user.wallet) return null;

			const transaction = await db.transaction.update({
				where: { transaction_id: input.transaction_id, user_id: user.user_id },
				data: {
					payment_status: "Completed",
				},
				select: { amount: true },
			});

			if (!transaction) return null;

			await db.wallet.update({
				where: { wallet_id: user.wallet?.wallet_id },
				data: { balance: user.wallet.balance.add(transaction.amount) },
			});

			const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);

			await db.transaction.updateMany({
				where: {
					payment_status: "Pending",
					transaction_date: {
						lt: tenMinutesAgo,
					},
				},
				data: {
					payment_status: "Failed",
				},
			});
		}),
	getPassbook: protectedProcedure.query(async ({ ctx }) => {
		const transactions = await db.transaction.findMany({
			where: { user_id: ctx.user.user_id },
			orderBy: {
				transaction_date: "desc",
			},
			select: {
				transaction_id: true,
				transaction_date: true,
				amount: true,
				transaction_type: true,
				payment_status: true,
			},
		});

		return transactions;
	}),
});
