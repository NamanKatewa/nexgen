import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { sendEmail } from "~/lib/email";
import logger from "~/lib/logger";
import {
	approvePendingAddressSchema,
	rejectPendingAddressSchema,
} from "~/schemas/address";
import { rejectKycSchema, verifyKycSchema } from "~/schemas/kyc";
import {
	approveShipmentSchema,
	rejectShipmentSchema,
} from "~/schemas/shipment";
import { adminProcedure, createTRPCRouter } from "~/server/api/trpc";
import { db } from "~/server/db";

export const adminRouter = createTRPCRouter({
	pendingKyc: adminProcedure
		.input(
			z.object({
				page: z.number().min(1).default(1),
				pageSize: z.number().min(1).max(100).default(10),
			}),
		)
		.query(async ({ input }) => {
			const { page, pageSize } = input;
			const skip = (page - 1) * pageSize;
			logger.info("Fetching pending KYC submissions", { page, pageSize });
			try {
				const [kycList, totalKyc] = await db.$transaction([
					db.kyc.findMany({
						where: {
							kyc_status: "Submitted",
						},
						include: {
							address: true,
							user: { select: { email: true, name: true } },
						},
						orderBy: { submission_date: "desc" },
						skip,
						take: pageSize,
					}),
					db.kyc.count({
						where: { kyc_status: "Submitted" },
					}),
				]);

				logger.info("Successfully fetched pending KYC submissions", {
					count: kycList.length,
					totalKyc,
					page,
					pageSize,
				});
				return {
					kycList,
					totalKyc,
					page,
					pageSize,
					totalPages: Math.ceil(totalKyc / pageSize),
				};
			} catch (error) {
				logger.error("Failed to fetch pending KYC submissions", { error });
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Something went wrong",
				});
			}
		}),
	verifyKyc: adminProcedure
		.input(verifyKycSchema)
		.mutation(async ({ input, ctx }) => {
			const logData = { kycId: input.kycId, adminId: ctx.user.user_id };
			logger.info("Verifying KYC", logData);

			const kyc = await db.kyc.findUnique({
				where: { kyc_id: input.kycId },
				include: { user: { select: { email: true } } },
			});
			if (!kyc) {
				logger.warn("KYC not found for verification", logData);
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "KYC not found",
				});
			}

			try {
				await db.kyc.update({
					where: { kyc_id: kyc.kyc_id },
					data: {
						kyc_status: "Approved",
						verification_date: new Date(),
						verified_by_user_id: ctx.user.user_id,
					},
				});
				await sendEmail({
					to: kyc.user.email,
					subject: "KYC Verified",
					html: "Your KYC has been verified. Logout and Login again to start shipping.",
				});

				logger.info("Successfully verified KYC", logData);
				return true;
			} catch (error) {
				logger.error("Failed to verify KYC", { ...logData, error });
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Something went wrong",
				});
			}
		}),
	rejectKyc: adminProcedure
		.input(rejectKycSchema)
		.mutation(async ({ input, ctx }) => {
			const logData = {
				kycId: input.kycId,
				adminId: ctx.user.user_id,
				reason: input.reason,
			};
			logger.info("Rejecting KYC", logData);

			const kyc = await db.kyc.findUnique({
				where: { kyc_id: input.kycId },
				include: { user: { select: { email: true } } },
			});
			if (!kyc) {
				logger.warn("KYC not found for rejection", logData);
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "KYC not found",
				});
			}

			try {
				await db.kyc.update({
					where: { kyc_id: kyc.kyc_id },
					data: {
						kyc_status: "Rejected",
						verification_date: new Date(),
						verified_by_user_id: ctx.user.user_id,
						rejection_reason: input.reason,
					},
				});
				await sendEmail({
					to: kyc.user.email,
					subject: "KYC Rejected",
					html: `Your KYC has been rejected for the following reason: ${input.reason}`,
				});
				logger.info("Successfully rejected KYC", logData);
				return true;
			} catch (error) {
				logger.error("Failed to reject KYC", { ...logData, error });
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Something went wrong",
				});
			}
		}),

	getTransactions: adminProcedure.query(async ({ ctx }) => {
		logger.info("Fetching all credit transactions");
		try {
			const transactions = await db.transaction.findMany({
				where: {
					transaction_type: "Credit",
					description: "Funds added to wallet",
				},
				select: {
					transaction_id: true,
					user: {
						select: {
							name: true,
							email: true,
						},
					},
					payment_status: true,
					transaction_type: true,
					amount: true,
					created_at: true,
				},
				orderBy: { created_at: "desc" },
			});
			logger.info("Successfully fetched all credit transactions", {
				count: transactions.length,
			});
			return transactions;
		} catch (error) {
			logger.error("Failed to fetch credit transactions", { error });
			throw new TRPCError({
				code: "INTERNAL_SERVER_ERROR",
				message: "Something went wrong",
			});
		}
	}),
	getPassbook: adminProcedure
		.input(
			z.object({
				page: z.number().min(1).default(1),
				pageSize: z.number().min(1).max(100).default(10),
			}),
		)
		.query(async ({ input }) => {
			const { page, pageSize } = input;
			const skip = (page - 1) * pageSize;
			logger.info("Fetching admin passbook", { page, pageSize });
			try {
				const [transactions, totalTransactions] = await db.$transaction([
					db.transaction.findMany({
						select: {
							transaction_id: true,
							created_at: true,
							amount: true,
							transaction_type: true,
							payment_status: true,
							description: true,
							user: {
								select: {
									name: true,
									email: true,
								},
							},
						},
						orderBy: {
							created_at: "desc",
						},
						skip,
						take: pageSize,
					}),
					db.transaction.count(),
				]);
				logger.info("Successfully fetched admin passbook", {
					count: transactions.length,
					totalTransactions,
					page,
					pageSize,
				});
				return {
					transactions,
					totalTransactions,
					page,
					pageSize,
					totalPages: Math.ceil(totalTransactions / pageSize),
				};
			} catch (error) {
				logger.error("Failed to fetch admin passbook", { error });
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Something went wrong",
				});
			}
		}),
	pendingShipments: adminProcedure
		.input(
			z.object({
				page: z.number().min(1).default(1),
				pageSize: z.number().min(1).max(100).default(10),
			}),
		)
		.query(async ({ input }) => {
			const { page, pageSize } = input;
			const skip = (page - 1) * pageSize;
			logger.info("Fetching pending shipments", { page, pageSize });
			try {
				const [shipments, totalShipments] = await db.$transaction([
					db.shipment.findMany({
						where: { shipment_status: "PendingApproval" },
						include: {
							origin_address: true,
							destination_address: true,
							user: { select: { email: true, name: true } },
						},
						orderBy: { created_at: "desc" },
						skip,
						take: pageSize,
					}),
					db.shipment.count({
						where: { shipment_status: "PendingApproval" },
					}),
				]);
				logger.info("Successfully fetched pending shipments", {
					count: shipments.length,
					totalShipments,
					page,
					pageSize,
				});
				return {
					shipments,
					totalShipments,
					page,
					pageSize,
					totalPages: Math.ceil(totalShipments / pageSize),
				};
			} catch (error) {
				logger.error("Failed to fetch pending shipments", { error });
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Something went wrong",
				});
			}
		}),

	approveShipment: adminProcedure
		.input(approveShipmentSchema)
		.mutation(async ({ input, ctx }) => {
			const logData = {
				shipmentId: input.shipmentId,
				adminId: ctx.user.user_id,
			};
			logger.info("Approving shipment", logData);

			const shipment = await db.shipment.findUnique({
				where: { shipment_id: input.shipmentId },
				include: { user: { select: { email: true } } },
			});
			if (!shipment) {
				logger.warn("Shipment not found for approval", logData);
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Shipment not found",
				});
			}

			try {
				await db.$transaction(async (prisma) => {
					await prisma.shipment.update({
						where: { shipment_id: shipment.shipment_id },
						data: {
							shipment_status: "Approved",
							awb_number: input.awbNumber,
						},
					});
				});
				logger.info("Successfully approved shipment", logData);
				return true;
			} catch (error) {
				logger.error("Failed to approve shipment", { ...logData, error });
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Something went wrong",
				});
			}
		}),

	rejectShipment: adminProcedure
		.input(rejectShipmentSchema)
		.mutation(async ({ input, ctx }) => {
			const logData = {
				shipmentId: input.shipmentId,
				adminId: ctx.user.user_id,
				reason: input.reason,
			};
			logger.info("Rejecting shipment", logData);

			const shipment = await db.shipment.findUnique({
				where: { shipment_id: input.shipmentId },
				include: { user: { select: { email: true } } },
			});
			if (!shipment) {
				logger.warn("Shipment not found for rejection", logData);
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Shipment not found",
				});
			}

			try {
				await db.$transaction(async (prisma) => {
					await prisma.shipment.update({
						where: { shipment_id: shipment.shipment_id },
						data: {
							shipment_status: "Rejected",
							rejection_reason: input.reason,
						},
					});

					await prisma.transaction.create({
						data: {
							user_id: shipment.user_id,
							transaction_type: "Credit",
							payment_status: "Completed",
							amount: shipment.shipping_cost,
							description: "Refund for rejected shipment",
						},
					});

					await prisma.wallet.update({
						where: { user_id: shipment.user_id },
						data: {
							balance: {
								increment: shipment.shipping_cost,
							},
						},
					});
				});
				logger.info(
					"Successfully rejected shipment and refunded user",
					logData,
				);
				return true;
			} catch (error) {
				logger.error("Failed to reject shipment", { ...logData, error });
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Something went wrong",
				});
			}
		}),

	pendingAddresses: adminProcedure
		.input(
			z.object({
				page: z.number().min(1).default(1),
				pageSize: z.number().min(1).max(100).default(10),
			}),
		)
		.query(async ({ input }) => {
			const { page, pageSize } = input;
			const skip = (page - 1) * pageSize;
			logger.info("Fetching pending addresses", { page, pageSize });
			try {
				const [pendingAddresses, totalPendingAddresses] = await db.$transaction(
					[
						db.pendingAddress.findMany({
							include: { user: true },
							orderBy: { created_at: "desc" },
							skip,
							take: pageSize,
						}),
						db.pendingAddress.count(),
					],
				);
				logger.info("Successfully fetched pending addresses", {
					count: pendingAddresses.length,
					totalPendingAddresses,
					page,
					pageSize,
				});
				return {
					pendingAddresses,
					totalPendingAddresses,
					page,
					pageSize,
					totalPages: Math.ceil(totalPendingAddresses / pageSize),
				};
			} catch (error) {
				logger.error("Failed to fetch pending addresses", { error });
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Something went wrong",
				});
			}
		}),

	approvePendingAddress: adminProcedure
		.input(approvePendingAddressSchema)
		.mutation(async ({ input, ctx }) => {
			const logData = {
				pendingAddressId: input.pendingAddressId,
				adminId: ctx.user.user_id,
			};
			logger.info("Approving pending address", logData);

			try {
				await db.$transaction(async (prisma) => {
					const pendingAddress = await prisma.pendingAddress.findUnique({
						where: { pending_address_id: input.pendingAddressId },
					});

					if (!pendingAddress) {
						logger.warn("Pending address not found for approval", logData);
						throw new TRPCError({
							code: "NOT_FOUND",
							message: "Pending address not found",
						});
					}

					await prisma.address.create({
						data: {
							zip_code: pendingAddress.zip_code,
							city: pendingAddress.city,
							state: pendingAddress.state,
							address_line: pendingAddress.address_line,
							name: pendingAddress.name,
							type: "Warehouse",
							user_id: pendingAddress.user_id,
						},
					});

					await prisma.pendingAddress.delete({
						where: { pending_address_id: input.pendingAddressId },
					});
				});

				logger.info("Successfully approved and moved pending address", logData);
				return true;
			} catch (error) {
				logger.error("Failed to approve pending address", {
					...logData,
					error,
				});
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Something went wrong",
				});
			}
		}),

	rejectPendingAddress: adminProcedure
		.input(rejectPendingAddressSchema)
		.mutation(async ({ input, ctx }) => {
			const logData = {
				pendingAddressId: input.pendingAddressId,
				adminId: ctx.user.user_id,
			};
			logger.info("Rejecting pending address", logData);

			try {
				await db.$transaction(async (prisma) => {
					const pendingAddress = await prisma.pendingAddress.findUnique({
						where: { pending_address_id: input.pendingAddressId },
					});

					if (!pendingAddress) {
						logger.warn("Pending address not found for rejection", logData);
						throw new TRPCError({
							code: "NOT_FOUND",
							message: "Pending address not found",
						});
					}

					await prisma.pendingAddress.delete({
						where: { pending_address_id: input.pendingAddressId },
					});
				});

				logger.info(
					"Successfully rejected and deleted pending address",
					logData,
				);
				return true;
			} catch (error) {
				logger.error("Failed to reject pending address", { ...logData, error });
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Something went wrong",
				});
			}
		}),
});
