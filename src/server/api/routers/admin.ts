import type { Prisma } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { sendEmail } from "~/lib/email";
import logger from "~/lib/logger";
import { pushOrderToShipway } from "~/lib/shipway";
import { getEndOfDay } from "~/lib/utils";
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
				filterGST: z.string().optional(),
				filterType: z.string().optional(),
				searchFilter: z.string().optional(),
				startDate: z.string().optional(),
				endDate: z.string().optional(),
			}),
		)
		.query(async ({ ctx, input }) => {
			const {
				page,
				pageSize,
				filterGST,
				filterType,
				searchFilter,
				startDate,
				endDate,
			} = input;
			const skip = (page - 1) * pageSize;
			const whereClause: Prisma.KycWhereInput = {
				kyc_status: "Submitted",
			};
			if (filterGST && filterGST !== "ALL") {
				whereClause.gst = filterGST === "YES";
			}
			if (filterType && filterType !== "ALL") {
				whereClause.entity_type =
					filterType as Prisma.KycWhereInput["entity_type"];
			}
			if (searchFilter) {
				whereClause.OR = [
					{ entity_name: { contains: searchFilter, mode: "insensitive" } },
					{ user: { email: { contains: searchFilter, mode: "insensitive" } } },
					{ user: { name: { contains: searchFilter, mode: "insensitive" } } },
					{
						user: {
							mobile_number: { contains: searchFilter, mode: "insensitive" },
						},
					},
				];
			}
			if (startDate && endDate) {
				whereClause.submission_date = {
					gte: new Date(startDate),
					lte: getEndOfDay(new Date(endDate)),
				};
			}
			try {
				const [kycList, totalKyc] = await db.$transaction([
					db.kyc.findMany({
						where: whereClause,
						select: {
							kyc_id: true,
							entity_name: true,
							user_id: true,
							user: {
								select: { email: true, name: true, mobile_number: true },
							},
							submission_date: true,
							address: {
								select: {
									address_line: true,
									zip_code: true,
									state: true,
									city: true,
									landmark: true,
								},
							},
							website_url: true,
							gst: true,
							aadhar_number: true,
							aadhar_image_front: true,
							aadhar_image_back: true,
							pan_number: true,
							pan_image_front: true,
							entity_type: true,
						},
						orderBy: { submission_date: "desc" },
						skip,
						take: pageSize,
					}),
					db.kyc.count({
						where: whereClause,
					}),
				]);
				return {
					kycList,
					totalKyc,
					page,
					pageSize,
					totalPages: Math.ceil(totalKyc / pageSize),
				};
			} catch (error) {
				logger.error("admin.pendingKyc", { req: ctx.req, user: ctx.user, input, error });
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Something went wrong",
				});
			}
		}),
	verifyKyc: adminProcedure
		.input(verifyKycSchema)
		.mutation(async ({ input, ctx }) => {
			const kyc = await db.kyc.findUnique({
				where: { kyc_id: input.kycId },
				include: { user: { select: { email: true } } },
			});
			if (!kyc) {
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
				return true;
			} catch (error) {
				logger.error("admin.verifyKyc", { req: ctx.req, user: ctx.user, input, error });
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Something went wrong",
				});
			}
		}),
	rejectKyc: adminProcedure
		.input(rejectKycSchema)
		.mutation(async ({ input, ctx }) => {
			const kyc = await db.kyc.findUnique({
				where: { kyc_id: input.kycId },
				include: { user: { select: { email: true } } },
			});
			if (!kyc) {
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
				return true;
			} catch (error) {
				logger.error("admin.rejectKyc", { req: ctx.req, user: ctx.user, input, error });
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Something went wrong",
				});
			}
		}),

	getTransactions: adminProcedure
		.input(
			z.object({
				page: z.number().min(1).default(1),
				pageSize: z.number().min(1).max(100).default(10),
				filterType: z.string().optional(),
				searchFilter: z.string().optional(),
				startDate: z.string().optional(),
				endDate: z.string().optional(),
			}),
		)
		.query(async ({ ctx, input }) => {
			const { page, pageSize, filterType, searchFilter, startDate, endDate } =
				input;
			const skip = (page - 1) * pageSize;
			const whereClause: Prisma.TransactionWhereInput = {
				transaction_type: "Credit",
			};
			if (filterType && filterType !== "ALL") {
				whereClause.payment_status =
					filterType as Prisma.TransactionWhereInput["payment_status"];
			}
			if (searchFilter) {
				whereClause.OR = [
					{ user: { email: { contains: searchFilter, mode: "insensitive" } } },
					{ user: { name: { contains: searchFilter, mode: "insensitive" } } },
					{ user_id: { contains: searchFilter, mode: "insensitive" } },
					{ transaction_id: { contains: searchFilter, mode: "insensitive" } },
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
							user_id: true,
							transaction_id: true,
							user: {
								select: {
									name: true,
									email: true,
								},
							},
							payment_status: true,
							amount: true,
							created_at: true,
						},
						orderBy: { created_at: "desc" },
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
				logger.error("admin.getTransactions", { req: ctx.req, user: ctx.user, input, error });
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
			const whereClause: Prisma.TransactionWhereInput = {};
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
					{ user_id: { contains: searchFilter, mode: "insensitive" } },
					{ transaction_id: { contains: searchFilter, mode: "insensitive" } },
					{ user: { email: { contains: searchFilter, mode: "insensitive" } } },
					{ user: { name: { contains: searchFilter, mode: "insensitive" } } },
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
							shipment_id: true,
							user_id: true,
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
				logger.error("admin.getPassbook", { req: ctx.req, user: ctx.user, input, error });
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
				searchFilter: z.string().optional(),
				startDate: z.string().optional(),
				endDate: z.string().optional(),
			}),
		)
		.query(async ({ ctx, input }) => {
			const { page, pageSize, searchFilter, startDate, endDate } = input;
			const skip = (page - 1) * pageSize;
			const whereClause: Prisma.ShipmentWhereInput = {
				shipment_status: { in: ["PendingApproval", "Hold"] },
			};
			if (searchFilter) {
				whereClause.OR = [
					{ user: { email: { contains: searchFilter, mode: "insensitive" } } },
					{ user: { name: { contains: searchFilter, mode: "insensitive" } } },
					{
						human_readable_shipment_id: {
							contains: searchFilter,
							mode: "insensitive",
						},
					},
					{ user_id: { contains: searchFilter, mode: "insensitive" } },
				];
			}
			if (startDate && endDate) {
				whereClause.created_at = {
					gte: new Date(startDate),
					lte: getEndOfDay(new Date(endDate)),
				};
			}

			try {
				const [shipments, totalShipments] = await db.$transaction([
					db.shipment.findMany({
						where: whereClause,
						select: {
							human_readable_shipment_id: true,
							shipping_cost: true,
							created_at: true,
							shipment_id: true,
							user: { select: { name: true, email: true } },
							recipient_name: true,
							recipient_mobile: true,
							package_weight: true,
							package_dimensions: true,
							package_image_url: true,
							payment_status: true,
							shipment_status: true,
							rejection_reason: true,
							origin_address: {
								select: {
									address_line: true,
									city: true,
									state: true,
									zip_code: true,
									landmark: true,
								},
							},
							destination_address: {
								select: {
									address_line: true,
									city: true,
									state: true,
									zip_code: true,
									landmark: true,
								},
							},
						},
						orderBy: { created_at: "desc" },
						skip,
						take: pageSize,
					}),
					db.shipment.count({
						where: whereClause,
					}),
				]);
				return {
					shipments,
					totalShipments,
					page,
					pageSize,
					totalPages: Math.ceil(totalShipments / pageSize),
				};
			} catch (error) {
				logger.error("admin.pendingShipments", { req: ctx.req, user: ctx.user, input, error });
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Something went wrong",
				});
			}
		}),
	approveShipment: adminProcedure
		.input(approveShipmentSchema)
		.mutation(async ({ ctx, input }) => {
			const { shipmentId, awbNumber, courierId } = input;

			const shipment = await ctx.db.shipment.findUnique({
				where: { shipment_id: shipmentId },
				select: {
					shipment_status: true,
					shipment_id: true,
					recipient_name: true,
					recipient_mobile: true,
					user: { select: { name: true, email: true, company_name: true } },
				},
			});

			if (!shipment) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Shipment not found.",
				});
			}

			if (shipment.shipment_status !== "PendingApproval") {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Shipment is not in 'Pending Approval' status.",
				});
			}

			const courier = await ctx.db.courier.findUnique({
				where: { id: courierId },
			});

			if (!courier) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Selected courier not found.",
				});
			}

			const shipwayPayload = {
				carrier_id: courier.shipway_id,
				awb: awbNumber,
				order_id: shipment.shipment_id,
				first_name: shipment.user.name.split(" ")[0] || "N/A",
				last_name: shipment.recipient_name,
				email: shipment.user.email,
				phone: shipment.recipient_mobile,
				products: "Shipment",
				company: shipment.user.company_name || "NexGen",
				shipment_type: "1",
			};

			try {
				await pushOrderToShipway(shipwayPayload);

				await ctx.db.shipment.update({
					where: { shipment_id: shipmentId },
					data: {
						awb_number: awbNumber,
						courier_id: courierId,
						shipment_status: "Approved",
					},
				});
				return {
					success: true,
					message: "Shipment approved and pushed to Shipway.",
				};
			} catch (error) {
				logger.error("admin.approveShipment", { req: ctx.req, user: ctx.user, input, error });
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: `Failed to approve shipment: ${error instanceof Error ? error.message : "Unknown error"}`,
				});
			}
		}),

	rejectShipment: adminProcedure
		.input(rejectShipmentSchema)
		.mutation(async ({ input, ctx }) => {
			const shipment = await db.shipment.findUnique({
				where: { shipment_id: input.shipmentId },
				select: { shipment_id: true, shipping_cost: true, user_id: true },
			});
			if (!shipment) {
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
				return true;
			} catch (error) {
				logger.error("admin.rejectShipment", { ctx, input, error });
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
				searchFilter: z.string().optional(),
				startDate: z.string().optional(),
				endDate: z.string().optional(),
			}),
		)
		.query(async ({ ctx, input }) => {
			const { page, pageSize, searchFilter, startDate, endDate } = input;
			const skip = (page - 1) * pageSize;
			const whereClause: Prisma.PendingAddressWhereInput = {};

			if (searchFilter) {
				whereClause.OR = [
					{ user_id: { contains: searchFilter, mode: "insensitive" } },
					{
						pending_address_id: { contains: searchFilter, mode: "insensitive" },
					},
					{ user: { name: { contains: searchFilter, mode: "insensitive" } } },
					{ user: { email: { contains: searchFilter, mode: "insensitive" } } },
					{ name: { contains: searchFilter, mode: "insensitive" } },
					{ address_line: { contains: searchFilter, mode: "insensitive" } },
					{ city: { contains: searchFilter, mode: "insensitive" } },
					{ state: { contains: searchFilter, mode: "insensitive" } },
					{ zip_code: Number.parseInt(searchFilter) || undefined },
				];
			}

			if (startDate && endDate) {
				whereClause.created_at = {
					gte: new Date(startDate),
					lte: getEndOfDay(new Date(endDate)),
				};
			}

			try {
				const [pendingAddresses, totalPendingAddresses] = await db.$transaction(
					[
						db.pendingAddress.findMany({
							where: whereClause,
							select: {
								pending_address_id: true,
								user_id: true,
								user: { select: { name: true, email: true } },
								landmark: true,
								name: true,
								address_line: true,
								city: true,
								state: true,
								zip_code: true,
							},
							orderBy: { created_at: "desc" },
							skip,
							take: pageSize,
						}),
						db.pendingAddress.count({
							where: whereClause,
						}),
					],
				);
				return {
					pendingAddresses,
					totalPendingAddresses,
					page,
					pageSize,
					totalPages: Math.ceil(totalPendingAddresses / pageSize),
				};
			} catch (error) {
				logger.error("admin.pendingAddresses", { req: ctx.req, user: ctx.user, input, error });
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Something went wrong",
				});
			}
		}),

	approvePendingAddress: adminProcedure
		.input(approvePendingAddressSchema)
		.mutation(async ({ input, ctx }) => {
			try {
				await db.$transaction(async (prisma) => {
					const pendingAddress = await prisma.pendingAddress.findUnique({
						where: { pending_address_id: input.pendingAddressId },
					});

					if (!pendingAddress) {
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
							landmark: pendingAddress.landmark,
							name: pendingAddress.name,
							type: "Warehouse",
							user_id: pendingAddress.user_id,
						},
					});

					await prisma.pendingAddress.delete({
						where: { pending_address_id: input.pendingAddressId },
					});
				});

				return true;
			} catch (error) {
				logger.error("admin.approvePendingAddress", { req: ctx.req, user: ctx.user, input, error });
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Something went wrong",
				});
			}
		}),

	rejectPendingAddress: adminProcedure
		.input(rejectPendingAddressSchema)
		.mutation(async ({ input, ctx }) => {
			try {
				await db.$transaction(async (prisma) => {
					const pendingAddress = await prisma.pendingAddress.findUnique({
						where: { pending_address_id: input.pendingAddressId },
					});

					if (!pendingAddress) {
						throw new TRPCError({
							code: "NOT_FOUND",
							message: "Pending address not found",
						});
					}

					await prisma.pendingAddress.delete({
						where: { pending_address_id: input.pendingAddressId },
					});
				});
				return true;
			} catch (error) {
				logger.error("admin.rejectPendingAddress", { req: ctx.req, user: ctx.user, input, error });
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Something went wrong",
				});
			}
		}),

	getUserById: adminProcedure
		.input(z.object({ userId: z.string() }))
		.query(async ({ ctx, input }) => {
			try {
				const user = await db.user.findUnique({
					where: { user_id: input.userId },
					select: {
						name: true,
						user_id: true,
						email: true,
						mobile_number: true,
						company_name: true,
						monthly_order: true,
						business_type: true,
						role: true,
						status: true,
						created_at: true,
						kyc: {
							select: {
								kyc_id: true,
								entity_name: true,
								entity_type: true,
								website_url: true,
								aadhar_number: true,
								pan_number: true,
								gst: true,
								kyc_status: true,
								submission_date: true,
								verification_date: true,
								rejection_reason: true,
								aadhar_image_front: true,
								aadhar_image_back: true,
								pan_image_front: true,
							},
						},
						wallet: { select: { wallet_id: true, balance: true } },
						shipments: {
							select: {
								shipment_id: true,
								human_readable_shipment_id: true,
								shipment_status: true,
								shipping_cost: true,
								created_at: true,
							},
							take: 2,
							orderBy: { created_at: "desc" },
						},
						transactions: {
							select: {
								transaction_id: true,
								transaction_type: true,
								amount: true,
								payment_status: true,
								description: true,
								created_at: true,
							},
							take: 2,
							orderBy: { created_at: "desc" },
						},
						tickets: {
							select: {
								ticket_id: true,
								subject: true,
								status: true,
								priority: true,
								created_at: true,
							},
							take: 2,
							orderBy: { created_at: "desc" },
						},
						employee: true,
						verifiedKYCs: true,
						addresses: {
							where: { type: "Warehouse" },
							select: {
								address_id: true,
								name: true,
								address_line: true,
								landmark: true,
								city: true,
								state: true,
								zip_code: true,
							},
						},
						userRates: {
							select: {
								user_rate_id: true,
								zone_from: true,
								zone_to: true,
								weight_slab: true,
								rate: true,
								created_at: true,
							},
							take: 2,
							orderBy: { created_at: "desc" },
						},
						pendingAddresses: {
							select: {
								pending_address_id: true,
								name: true,
								landmark: true,
								city: true,
								state: true,
								zip_code: true,
								created_at: true,
								address_line: true,
							},
							take: 2,
							orderBy: { created_at: "desc" },
						},
					},
				});

				if (!user) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "User not found",
					});
				}

				return user;
			} catch (error) {
				logger.error("admin.getUserById", { req: ctx.req, user: ctx.user, input, error });
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Something went wrong",
				});
			}
		}),

	getAllUsers: adminProcedure
		.input(
			z.object({
				page: z.number().min(1).default(1),
				pageSize: z.number().min(1).max(100).default(10),
				searchFilter: z.string().optional(),
				businessType: z.enum(["Retailer", "Ecommerce", "Franchise"]).optional(),
				role: z.enum(["Client", "Admin", "Employee"]).optional(),
				status: z.enum(["Active", "Inactive"]).optional(),
				startDate: z.string().optional(),
				endDate: z.string().optional(),
			}),
		)
		.query(async ({ ctx, input }) => {
			const {
				page,
				pageSize,
				searchFilter,
				businessType,
				role,
				status,
				startDate,
				endDate,
			} = input;
			const skip = (page - 1) * pageSize;
			const whereClause: Prisma.UserWhereInput = {};
			if (searchFilter) {
				whereClause.OR = [
					{ name: { contains: searchFilter, mode: "insensitive" } },
					{ email: { contains: searchFilter, mode: "insensitive" } },
					{ mobile_number: { contains: searchFilter, mode: "insensitive" } },
					{ company_name: { contains: searchFilter, mode: "insensitive" } },
				];
			}
			if (businessType) {
				whereClause.business_type = businessType;
			}
			if (role) {
				whereClause.role = role;
			}
			if (status) {
				whereClause.status = status;
			}
			if (startDate && endDate) {
				whereClause.created_at = {
					gte: new Date(startDate),
					lte: getEndOfDay(new Date(endDate)),
				};
			}
			try {
				const [users, totalUsers] = await db.$transaction([
					db.user.findMany({
						where: whereClause,
						orderBy: { created_at: "desc" },
						select: {
							user_id: true,
							email: true,
							business_type: true,
							role: true,
							status: true,
							created_at: true,
							name: true,
							mobile_number: true,
							company_name: true,
						},
						skip,
						take: pageSize,
					}),
					db.user.count({
						where: whereClause,
					}),
				]);
				return {
					users,
					totalUsers,
					page,
					pageSize,
					totalPages: Math.ceil(totalUsers / pageSize),
				};
			} catch (error) {
				logger.error("admin.getAllUsers", { req: ctx.req, user: ctx.user, input, error });
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Something went wrong",
				});
			}
		}),

	getUsersWithPendingShipments: adminProcedure
		.input(
			z.object({
				page: z.number().min(1).default(1),
				pageSize: z.number().min(1).max(100).default(10),
				searchFilter: z.string().optional(),
				startDate: z.string().optional(),
				endDate: z.string().optional(),
			}),
		)
		.query(async ({ ctx, input }) => {
			const { page, pageSize, searchFilter, startDate, endDate } = input;
			const skip = (page - 1) * pageSize;

			const whereClause: Prisma.UserWhereInput = {};
			if (searchFilter) {
				whereClause.OR = [
					{ name: { contains: searchFilter, mode: "insensitive" } },
					{ email: { contains: searchFilter, mode: "insensitive" } },
					{ mobile_number: { contains: searchFilter, mode: "insensitive" } },
					{ company_name: { contains: searchFilter, mode: "insensitive" } },
					{ user_id: { contains: searchFilter, mode: "insensitive" } },
				];
			}
			if (startDate && endDate) {
				whereClause.created_at = {
					gte: new Date(startDate),
					lte: getEndOfDay(new Date(endDate)),
				};
			}
			const userFilter: Prisma.UserWhereInput = {
				...whereClause,
				shipments: {
					some: {
						shipment_status: "PendingApproval",
					},
				},
			};

			try {
				const [users, totalUsers] = await db.$transaction([
					db.user.findMany({
						where: userFilter,
						select: {
							user_id: true,
							name: true,
							email: true,
							mobile_number: true,
							company_name: true,
							_count: {
								select: {
									shipments: {
										where: { shipment_status: "PendingApproval" },
									},
								},
							},
						},
						orderBy: { created_at: "desc" },
						skip,
						take: pageSize,
					}),
					db.user.count({
						where: userFilter,
					}),
				]);

				const usersWithPendingCount = users.map((user) => ({
					...user,
					pendingShipmentCount: user._count.shipments,
				}));
				return {
					users: usersWithPendingCount,
					totalUsers,
					page,
					pageSize,
					totalPages: Math.ceil(totalUsers / pageSize),
				};
			} catch (error) {
				logger.error("admin.getUsersWithPendingShipments", { req: ctx.req, user: ctx.user, input, error });
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Something went wrong",
				});
			}
		}),
});
