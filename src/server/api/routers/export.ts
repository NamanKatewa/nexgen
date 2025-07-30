import type { Prisma } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import logger from "~/lib/logger";
import { getEndOfDay } from "~/lib/utils";
import {
	adminProcedure,
	createTRPCRouter,
	protectedProcedure,
} from "~/server/api/trpc";
import { db } from "~/server/db";

export const exportRouter = createTRPCRouter({
	allTracking: adminProcedure
		.input(
			z.object({
				searchFilter: z.string().optional(),
				startDate: z.string().optional(),
				endDate: z.string().optional(),
				currentStatus: z.string().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const { searchFilter, startDate, endDate, currentStatus } = input;

			const whereClause: Prisma.ShipmentWhereInput = {
				shipment_status: "Approved",
			};

			if (searchFilter) {
				whereClause.OR = [
					{
						human_readable_shipment_id: {
							contains: searchFilter,
							mode: "insensitive",
						},
					},
					{ awb_number: { contains: searchFilter, mode: "insensitive" } },
					{ user: { email: { contains: searchFilter, mode: "insensitive" } } },
					{ user: { name: { contains: searchFilter, mode: "insensitive" } } },
					{ recipient_name: { contains: searchFilter, mode: "insensitive" } },
					{ recipient_mobile: { contains: searchFilter, mode: "insensitive" } },
				];
			}

			if (startDate && endDate) {
				whereClause.created_at = {
					gte: new Date(startDate),
					lte: getEndOfDay(new Date(endDate)),
				};
			}

			if (currentStatus && currentStatus !== "ALL") {
				whereClause.current_status =
					currentStatus as Prisma.ShipmentWhereInput["current_status"];
			}

			try {
				const shipments = await db.shipment.findMany({
					where: whereClause,
					select: {
						human_readable_shipment_id: true,
						awb_number: true,
						compensation_amount: true,
						created_at: true,
						current_status: true,
						declared_value: true,
						insurance_premium: true,
						is_insurance_selected: true,
						package_dimensions: true,
						package_weight: true,
						recipient_mobile: true,
						recipient_name: true,
						shipment_status: true,
						shipping_cost: true,
						user: { select: { name: true, email: true } },
						courier: { select: { name: true } },
						origin_address: {
							select: {
								address_line: true,
								city: true,
								landmark: true,
								state: true,
								zip_code: true,
							},
						},
						destination_address: {
							select: {
								address_line: true,
								city: true,
								landmark: true,
								state: true,
								zip_code: true,
							},
						},
					},
					orderBy: { created_at: "desc" },
				});

				return shipments;
			} catch (error) {
				logger.error("export.allTracking", {
					req: ctx.req,
					user: ctx.user,
					input,
					error,
				});
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Something went wrong",
				});
			}
		}),
	userTracking: protectedProcedure
		.input(
			z.object({
				searchFilter: z.string().optional(),
				startDate: z.string().optional(),
				endDate: z.string().optional(),
				currentStatus: z.string().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const { user } = ctx;
			const { searchFilter, startDate, endDate, currentStatus } = input;

			const whereClause: Prisma.ShipmentWhereInput = {
				user_id: user.user_id,
				shipment_status: "Approved",
			};

			if (searchFilter) {
				whereClause.OR = [
					{
						human_readable_shipment_id: {
							contains: searchFilter,
							mode: "insensitive",
						},
					},
					{ awb_number: { contains: searchFilter, mode: "insensitive" } },
					{ recipient_name: { contains: searchFilter, mode: "insensitive" } },
					{ recipient_mobile: { contains: searchFilter, mode: "insensitive" } },
				];
			}

			if (startDate && endDate) {
				whereClause.created_at = {
					gte: new Date(startDate),
					lte: getEndOfDay(new Date(endDate)),
				};
			}

			if (currentStatus && currentStatus !== "ALL") {
				whereClause.current_status =
					currentStatus as Prisma.ShipmentWhereInput["current_status"];
			}

			try {
				const shipments = await db.shipment.findMany({
					where: whereClause,
					select: {
						human_readable_shipment_id: true,
						awb_number: true,
						compensation_amount: true,
						created_at: true,
						current_status: true,
						declared_value: true,
						insurance_premium: true,
						is_insurance_selected: true,
						package_dimensions: true,
						package_weight: true,
						recipient_mobile: true,
						recipient_name: true,
						shipment_status: true,
						shipping_cost: true,
						courier: { select: { name: true } },
						origin_address: {
							select: {
								address_line: true,
								city: true,
								landmark: true,
								state: true,
								zip_code: true,
							},
						},
						destination_address: {
							select: {
								address_line: true,
								city: true,
								landmark: true,
								state: true,
								zip_code: true,
							},
						},
					},
					orderBy: { created_at: "desc" },
				});

				return shipments;
			} catch (error) {
				logger.error("export.userTracking", {
					req: ctx.req,
					user: ctx.user,
					input,
					error,
				});
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Something went wrong",
				});
			}
		}),
	exportPassbook: adminProcedure
		.input(
			z.object({
				filterStatus: z.string().optional(),
				filterTxnType: z.string().optional(),
				searchFilter: z.string().optional(),
				startDate: z.string().optional(),
				endDate: z.string().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const { filterStatus, filterTxnType, searchFilter, startDate, endDate } =
				input;

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
				];
			}

			if (startDate && endDate) {
				whereClause.created_at = {
					gte: new Date(startDate),
					lte: getEndOfDay(new Date(endDate)),
				};
			}

			try {
				const transactions = await db.transaction.findMany({
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
				});
				return transactions;
			} catch (error) {
				logger.error("export.exportPassbook", {
					req: ctx.req,
					user: ctx.user,
					input,
					error,
				});
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Something went wrong",
				});
			}
		}),
	exportUserPassbook: protectedProcedure
		.input(
			z.object({
				filterStatus: z.string().optional(),
				filterTxnType: z.string().optional(),
				searchFilter: z.string().optional(),
				startDate: z.string().optional(),
				endDate: z.string().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const { filterStatus, filterTxnType, searchFilter, startDate, endDate } =
				input;
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
				];
				const parsedAmount = Number.parseFloat(searchFilter);
				if (!Number.isNaN(parsedAmount)) {
					whereClause.OR.push({ amount: parsedAmount });
				}
			}

			if (startDate && endDate) {
				whereClause.created_at = {
					gte: new Date(startDate),
					lte: getEndOfDay(new Date(endDate)),
				};
			}

			try {
				const transactions = await db.transaction.findMany({
					where: whereClause,
					select: {
						transaction_id: true,
						created_at: true,
						amount: true,
						transaction_type: true,
						payment_status: true,
						description: true,
						shipment_id: true,
					},
					orderBy: {
						created_at: "desc",
					},
				});

				return transactions;
			} catch (error) {
				logger.error("export.exportUserPassbook", {
					req: ctx.req,
					user: ctx.user,
					input,
					error,
				});
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Something went wrong",
				});
			}
		}),

	exportTransactions: adminProcedure
		.input(
			z.object({
				filterType: z.string().optional(),
				searchFilter: z.string().optional(),
				startDate: z.string().optional(),
				endDate: z.string().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const { filterType, searchFilter, startDate, endDate } = input;

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
				const transactions = await db.transaction.findMany({
					where: whereClause,
					select: {
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
				});
				return transactions;
			} catch (error) {
				logger.error("export.exportTransactions", {
					req: ctx.req,
					user: ctx.user,
					input,
					error,
				});
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Something went wrong",
				});
			}
		}),
	exportShipments: adminProcedure
		.input(
			z.object({
				searchFilter: z.string().optional(),
				startDate: z.string().optional(),
				endDate: z.string().optional(),
				filterStatus: z.string().optional(),
				filterCourier: z.string().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const { searchFilter, startDate, endDate, filterStatus, filterCourier } =
				input;

			const whereClause: Prisma.ShipmentWhereInput = {};

			if (searchFilter) {
				whereClause.OR = [
					{
						human_readable_shipment_id: {
							contains: searchFilter,
							mode: "insensitive",
						},
					},
					{ awb_number: { contains: searchFilter, mode: "insensitive" } },
					{ user: { email: { contains: searchFilter, mode: "insensitive" } } },
					{ user: { name: { contains: searchFilter, mode: "insensitive" } } },
					{ recipient_name: { contains: searchFilter, mode: "insensitive" } },
					{ recipient_mobile: { contains: searchFilter, mode: "insensitive" } },
				];
			}

			if (startDate && endDate) {
				whereClause.created_at = {
					gte: new Date(startDate),
					lte: getEndOfDay(new Date(endDate)),
				};
			}

			if (filterStatus && filterStatus !== "ALL") {
				whereClause.shipment_status =
					filterStatus as Prisma.ShipmentWhereInput["shipment_status"];
			}

			if (filterCourier && filterCourier !== "ALL") {
				whereClause.courier = { name: filterCourier };
			}

			try {
				const shipments = await db.shipment.findMany({
					where: whereClause,
					select: {
						human_readable_shipment_id: true,
						awb_number: true,
						compensation_amount: true,
						created_at: true,
						current_status: true,
						declared_value: true,
						insurance_premium: true,
						is_insurance_selected: true,
						package_dimensions: true,
						package_weight: true,
						recipient_mobile: true,
						recipient_name: true,
						shipment_status: true,
						shipping_cost: true,
						courier: { select: { name: true } },
						origin_address: {
							select: {
								address_line: true,
								city: true,
								landmark: true,
								state: true,
								zip_code: true,
							},
						},
						destination_address: {
							select: {
								address_line: true,
								city: true,
								landmark: true,
								state: true,
								zip_code: true,
							},
						},
					},
					orderBy: { created_at: "desc" },
				});
				return shipments;
			} catch (error) {
				logger.error("export.exportShipments", {
					req: ctx.req,
					user: ctx.user,
					input,
					error,
				});
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Something went wrong",
				});
			}
		}),
	exportUsers: adminProcedure
		.input(
			z.object({
				searchFilter: z.string().optional(),
				businessType: z.enum(["Retailer", "Ecommerce", "Franchise"]).optional(),
				role: z.enum(["Client", "Admin", "Employee"]).optional(),
				status: z.enum(["Active", "Inactive"]).optional(),
				startDate: z.string().optional(),
				endDate: z.string().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const { searchFilter, businessType, role, status, startDate, endDate } =
				input;

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
				const users = await db.user.findMany({
					where: whereClause,
					orderBy: { created_at: "desc" },
					select: {
						user_id: true,
						business_type: true,
						company_name: true,
						mobile_number: true,
						name: true,
						wallet: { select: { balance: true } },
						kyc: {
							select: {
								entity_name: true,
								entity_type: true,
								pan_number: true,
								aadhar_number: true,
								gst: true,
								kyc_status: true,
								submission_date: true,
								verification_date: true,
								rejection_reason: true,
								website_url: true,
								address: {
									select: {
										address_line: true,
										city: true,
										landmark: true,
										state: true,
										zip_code: true,
									},
								},
							},
						},
					},
				});
				return users;
			} catch (error) {
				logger.error("export.exportUsers", {
					req: ctx.req,
					user: ctx.user,
					input,
					error,
				});
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Something went wrong",
				});
			}
		}),
});
