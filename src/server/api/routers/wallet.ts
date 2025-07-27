import type { Prisma } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { env } from "~/env";
import { checkIMBOrderStatus, createIMBPaymentOrder } from "~/lib/imb";
import logger from "~/lib/logger";
import { getEndOfDay } from "~/lib/utils";
import { addFundsSchema, paymentSuccessSchema } from "~/schemas/wallet";
import { adminProcedure } from "~/server/api/trpc";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { db } from "~/server/db";

export const walletRouter = createTRPCRouter({
	addFundsToWallet: adminProcedure
		.input(
			z.object({
				userId: z.string(),
				amount: z.number().min(1, "Amount must be at least 1"),
				description: z.string().min(1, "Description is required"),
			}),
		)
		.mutation(async ({ input }) => {
			try {
				const { userId, amount, description } = input;

				const userWallet = await db.wallet.findUnique({
					where: { user_id: userId },
				});

				if (!userWallet) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "User wallet not found",
					});
				}

				await db.$transaction(async (prisma) => {
					await prisma.transaction.create({
						data: {
							user_id: userId,
							transaction_type: "Credit",
							payment_status: "Completed",
							amount: amount,
							description: description,
						},
					});

					await prisma.wallet.update({
						where: { wallet_id: userWallet.wallet_id },
						data: {
							balance: {
								increment: amount,
							},
						},
					});
				});

				return { success: true, message: "Funds added successfully" };
			} catch (error) {
				logger.error("wallet.addFundsToWallet", { input, error });
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to add funds",
				});
			}
		}),
	addFunds: protectedProcedure
		.input(addFundsSchema)
		.mutation(async ({ input, ctx }) => {
			try {
				const dbUser = await db.user.findUnique({
					where: { user_id: ctx.user.user_id },
					select: {
						mobile_number: true,
						email: true,
						wallet: { select: { wallet_id: true } },
					},
				});

				if (!dbUser?.wallet) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "User or wallet not found",
					});
				}

				const transaction = await db.transaction.create({
					data: {
						user_id: ctx.user.user_id as string,
						transaction_type: "Credit",
						payment_status: "Pending",
						amount: input.amount,
						description: "Funds added to wallet",
					},
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

				return {
					paymentUrl: imbResponse.result.payment_url,
				};
			} catch (error) {
				logger.error("wallet.addFunds", { ctx, input, error });
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: (error as Error).message,
				});
			}
		}),
	updateTransaction: protectedProcedure
		.input(paymentSuccessSchema)
		.mutation(async ({ input, ctx }) => {
			try {
				const dbUser = await db.user.findUnique({
					where: { user_id: ctx.user.user_id },
					select: { wallet: { select: { wallet_id: true, balance: true } } },
				});

				if (!dbUser?.wallet) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "User or wallet not found",
					});
				}

				const userWallet = dbUser.wallet;

				await db.$transaction(async (prisma) => {
					const transaction = await prisma.transaction.findUnique({
						where: {
							transaction_id: input.transaction_id,
							user_id: ctx.user.user_id,
						},
						select: { amount: true, payment_status: true },
					});

					if (!transaction) {
						throw new TRPCError({
							code: "NOT_FOUND",
							message: "Transaction not found",
						});
					}

					// Only update if the transaction is still pending
					if (transaction.payment_status === "Pending") {
						await prisma.transaction.update({
							where: { transaction_id: input.transaction_id },
							data: { payment_status: "Completed" },
						});

						await prisma.wallet.update({
							where: { wallet_id: userWallet.wallet_id },
							data: { balance: userWallet.balance.add(transaction.amount) },
						});
					}
				});
			} catch (error) {
				logger.error("support.updateTransaction", { ctx, input, error });
				throw error;
			}
		}),
	checkPendingTransactions: protectedProcedure.mutation(async ({ ctx }) => {
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

			const pendingTransactions = await db.transaction.findMany({
				where: {
					user_id: ctx.user.user_id,
					payment_status: "Pending",
				},
				select: {
					transaction_id: true,
					amount: true,
					user_id: true,
					user: { select: { wallet: true } },
				},
			});

			for (const transaction of pendingTransactions) {
				try {
					const imbStatus = await checkIMBOrderStatus({
						order_id: transaction.transaction_id,
					});

					if (imbStatus.result.status === "SUCCESS") {
						// Use a transaction to ensure atomicity of status update and wallet balance update
						await db.$transaction(async (prisma) => {
							// Re-fetch the transaction within the transaction block to get its latest state
							const currentTransaction = await prisma.transaction.findUnique({
								where: { transaction_id: transaction.transaction_id },
								select: {
									payment_status: true,
									amount: true,
									user: { select: { wallet: true } },
								},
							});

							// Only proceed if the transaction is still pending
							if (currentTransaction?.payment_status === "Pending") {
								await prisma.transaction.update({
									where: { transaction_id: transaction.transaction_id },
									data: { payment_status: "Completed" },
								});

								if (currentTransaction.user?.wallet) {
									await prisma.wallet.update({
										where: {
											wallet_id: currentTransaction.user.wallet.wallet_id,
										},
										data: {
											balance: currentTransaction.user.wallet.balance.add(
												currentTransaction.amount,
											),
										},
									});
								}
							}
						});
					} else if (imbStatus.result.status === "FAILED") {
						await db.transaction.update({
							where: { transaction_id: transaction.transaction_id },
							data: { payment_status: "Failed" },
						});
					}
				} catch (imbError) {
					logger.error("wallet.checkPendingTransactions", {
						transactionId: transaction.transaction_id,
						error: imbError,
					});
				}
			}
		} catch (error) {
			logger.error("wallet.checkPendingTransactions", { ctx, error });
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

			const whereClause: Prisma.TransactionWhereInput = {
				user_id: ctx.user.user_id,
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
							shipment_id: true,
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

				return {
					transactions,
					totalTransactions,
					page,
					pageSize,
					totalPages: Math.ceil(totalTransactions / pageSize),
				};
			} catch (error) {
				logger.error("wallet.getPassbook", { ctx, input, error });
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Something went wrong",
				});
			}
		}),
});
