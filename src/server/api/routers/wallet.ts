import type { Prisma } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { env } from "~/env";
import { checkIMBOrderStatus, createIMBPaymentOrder } from "~/lib/imb";
import logger from "~/lib/logger";
import { getEndOfDay } from "~/lib/utils";
import { addFundsSchema, paymentSuccessSchema } from "~/schemas/wallet";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { db } from "~/server/db";

export const walletRouter = createTRPCRouter({
	addFunds: protectedProcedure
		.input(addFundsSchema)
		.mutation(async ({ input, ctx }) => {
			const { user } = ctx;
			const logData = { userId: user.user_id, amount: input.amount };
			logger.info("Attempting to add funds to wallet", logData);

			try {
				const dbUser = await db.user.findUnique({
					where: { user_id: user.user_id },
					include: { wallet: { select: { wallet_id: true } } },
				});

				if (!dbUser?.wallet) {
					logger.error("User or wallet not found", { ...logData });
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "User or wallet not found",
					});
				}

				const transaction = await db.transaction.create({
					data: {
						user_id: user.user_id as string,
						transaction_type: "Credit",
						payment_status: "Pending",
						amount: input.amount,
						description: "Funds added to wallet",
					},
				});
				logger.info("Created pending transaction", {
					...logData,
					transactionId: transaction.transaction_id,
				});

				const redirectUrl = `${
					ctx.headers.get("x-forwarded-proto") ?? "http"
				}://${ctx.headers.get("host")}/dashboard/wallet/callback?id=${
					transaction.transaction_id
				}`;

				const imbResponse = await createIMBPaymentOrder({
					customer_mobile: dbUser.mobile_number,
					user_token: env.IMB_TOKEN,
					amount: input.amount,
					order_id: transaction.transaction_id,
					redirect_url: redirectUrl,
					remark1: dbUser.email,
				});

				logger.info("Successfully created IMB payment order", {
					...logData,
					paymentUrl: imbResponse.result.payment_url,
				});
				return {
					paymentUrl: imbResponse.result.payment_url,
				};
			} catch (error) {
				logger.error("Failed to add funds", { ...logData, error });
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: (error as Error).message,
				});
			}
		}),
	updateTransaction: protectedProcedure
		.input(paymentSuccessSchema)
		.mutation(async ({ input, ctx }) => {
			const { user } = ctx;
			const logData = {
				userId: user.user_id,
				transactionId: input.transaction_id,
			};
			logger.info("Updating transaction after successful payment", logData);

			try {
				const dbUser = await db.user.findUnique({
					where: { user_id: user.user_id },
					include: { wallet: { select: { wallet_id: true, balance: true } } },
				});

				if (!dbUser?.wallet) {
					logger.error("User or wallet not found for transaction update", {
						...logData,
					});
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "User or wallet not found",
					});
				}

				const transaction = await db.transaction.update({
					where: {
						transaction_id: input.transaction_id,
						user_id: user.user_id,
					},
					data: {
						payment_status: "Completed",
					},
					select: { amount: true },
				});

				if (!transaction) {
					logger.error("Transaction not found for update", { ...logData });
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "Transaction not found",
					});
				}

				await db.wallet.update({
					where: { wallet_id: dbUser.wallet.wallet_id },
					data: { balance: dbUser.wallet.balance.add(transaction.amount) },
				});

				logger.info("Successfully updated transaction and wallet balance", {
					...logData,
					amount: transaction.amount,
				});
			} catch (error) {
				logger.error("Failed to update transaction", { ...logData, error });
				throw error;
			}
		}),
	checkPendingTransactions: protectedProcedure.mutation(async ({ ctx }) => {
		logger.info("Starting check for pending IMB transactions.");

		try {
			const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);

			await db.transaction.updateMany({
				where: {
					payment_status: "Pending",
					created_at: {
						lt: tenMinutesAgo,
					},
				},
				data: {
					payment_status: "Failed",
				},
			});
			logger.info("Cleaned up old pending transactions");

			const pendingTransactions = await db.transaction.findMany({
				where: {
					user_id: ctx.user.user_id,
					payment_status: "Pending",
				},
				include: { user: { select: { wallet: true } } },
			});

			logger.info("Found pending transactions to check", {
				count: pendingTransactions.length,
			});

			for (const transaction of pendingTransactions) {
				try {
					const imbStatus = await checkIMBOrderStatus({
						order_id: transaction.transaction_id,
					});

					if (imbStatus.result.status === "SUCCESS") {
						await db.transaction.update({
							where: { transaction_id: transaction.transaction_id },
							data: { payment_status: "Completed" },
						});

						if (transaction.user.wallet) {
							await db.wallet.update({
								where: { wallet_id: transaction.user.wallet.wallet_id },
								data: {
									balance: transaction.user.wallet.balance.add(
										transaction.amount,
									),
								},
							});
							logger.info("Updated wallet balance for completed transaction", {
								transactionId: transaction.transaction_id,
								userId: transaction.user_id,
							});
						}
						logger.info("Transaction marked as Completed", {
							transactionId: transaction.transaction_id,
						});
					} else if (imbStatus.result.status === "FAILED") {
						await db.transaction.update({
							where: { transaction_id: transaction.transaction_id },
							data: { payment_status: "Failed" },
						});
						logger.info("Transaction marked as Failed", {
							transactionId: transaction.transaction_id,
						});
					} else {
						logger.info("Transaction still pending at IMB", {
							transactionId: transaction.transaction_id,
						});
					}
				} catch (imbError) {
					logger.error("Error checking IMB status for transaction", {
						transactionId: transaction.transaction_id,
						error: imbError,
					});
				}
			}
			logger.info("Finished checking pending IMB transactions.");
		} catch (error) {
			logger.error("Failed to check pending transactions", { error });
			throw new TRPCError({
				code: "INTERNAL_SERVER_ERROR",
				message: "Failed to check pending transactions",
			});
		}
	}),
	getPassbook: protectedProcedure
		.input(
			z.object({
				page: z.number().min(1).default(1),
				pageSize: z.number().min(1).max(100).default(10),
				filterStatus: z.string().optional(),
				filterTxnType: z.string().optional(),
				searchFilter: z.string().optional(),
				startDate: z.string().optional(),
				endDate: z.string().optional(),
			}),
		)
		.query(async ({ ctx, input }) => {
			const { user } = ctx;
			const {
				page,
				pageSize,
				filterStatus,
				filterTxnType,
				searchFilter,
				startDate,
				endDate,
			} = input;
			const skip = (page - 1) * pageSize;
			const logData = { userId: user.user_id, page, pageSize };
			logger.info("Fetching user passbook", logData);

			const whereClause: Prisma.TransactionWhereInput = {
				user_id: user.user_id,
			};

			if (filterStatus && filterStatus !== "ALL") {
				whereClause.payment_status =
					filterStatus as Prisma.TransactionWhereInput["payment_status"];
			}

			if (filterTxnType && filterTxnType !== "ALL") {
				whereClause.transaction_type =
					filterTxnType as Prisma.TransactionWhereInput["transaction_type"];
			}

			if (searchFilter) {
				whereClause.OR = [
					{ description: { contains: searchFilter, mode: "insensitive" } },
					{ amount: Number.parseFloat(searchFilter) || undefined },
				];
			}

			if (startDate && endDate) {
				whereClause.created_at = {
					gte: new Date(startDate),
					lte: getEndOfDay(new Date(endDate)),
				};
			}

			try {
				const [transactions, totalTransactions] = await db.$transaction([
					db.transaction.findMany({
						where: whereClause,
						select: {
							transaction_id: true,
							created_at: true,
							amount: true,
							transaction_type: true,
							payment_status: true,
							description: true,
						},
						orderBy: {
							created_at: "desc",
						},
						skip,
						take: pageSize,
					}),
					db.transaction.count({
						where: whereClause,
					}),
				]);

				logger.info("Successfully fetched user passbook", {
					...logData,
					count: transactions.length,
					totalTransactions,
				});
				return {
					transactions,
					totalTransactions,
					page,
					pageSize,
					totalPages: Math.ceil(totalTransactions / pageSize),
				};
			} catch (error) {
				logger.error("Failed to fetch user passbook", { ...logData, error });
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Something went wrong",
				});
			}
		}),
});
