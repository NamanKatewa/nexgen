import { type Prisma, SUPPORT_STATUS, USER_ROLE } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import logger from "~/lib/logger";
import { getEndOfDay } from "~/lib/utils";
import {
	addMessageSchema,
	assignTicketSchema,
	createTicketSchema,
	getAllTicketsSchema,
	getTicketDetailsSchema,
	getTicketMessagesSchema,
	getUserTicketsSchema,
	updateTicketPrioritySchema,
	updateTicketStatusSchema,
} from "~/schemas/support";
import { adminProcedure, createTRPCRouter, protectedProcedure } from "../trpc";

export const supportRouter = createTRPCRouter({
	createTicket: protectedProcedure
		.input(createTicketSchema)
		.mutation(async ({ ctx, input }) => {
			try {
				const newTicket = await ctx.db.supportTicket.create({
					data: {
						user_id: ctx.user.user_id,
						subject: input.subject,
						description: input.description,
						awb: input.awb,
						status: SUPPORT_STATUS.Open,
						priority: "Low",
						messages: {
							create: {
								sender_id: ctx.user.user_id,
								sender_role: ctx.user.role,
								content: input.description,
							},
						},
					},
				});

				return newTicket;
			} catch (error) {
				logger.error("support.createTicket", { req: ctx.req, user: ctx.user, input, error });
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to create support ticket",
				});
			}
		}),

	getUserTickets: protectedProcedure
		.input(getUserTicketsSchema)
		.query(async ({ ctx, input }) => {
			try {
				const { status, priority, page, pageSize } = input;
				const whereClause: Prisma.SupportTicketWhereInput = {
					user_id: ctx.user.user_id,
				};
				if (status) whereClause.status = status;
				if (priority) whereClause.priority = priority;

				if (input.startDate && input.endDate) {
					whereClause.created_at = {
						gte: new Date(input.startDate),
						lte: getEndOfDay(new Date(input.endDate)),
					};
				}

				const tickets = await ctx.db.supportTicket.findMany({
					where: whereClause,
					skip: (page - 1) * pageSize,
					take: pageSize,
					orderBy: { created_at: "desc" },
					include: {
						messages: {
							select: { content: true, sender_id: true, sender_role: true },
							orderBy: { created_at: "desc" },
							take: 1,
						},
					},
				});

				const totalTickets = await ctx.db.supportTicket.count({
					where: whereClause,
				});
				return { tickets, totalTickets };
			} catch (error) {
				logger.error("support.getUserTickets", { req: ctx.req, user: ctx.user, input, error });
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to fetch user support tickets",
				});
			}
		}),

	getTicketMessages: protectedProcedure
		.input(getTicketMessagesSchema)
		.query(async ({ ctx, input }) => {
			try {
				const ticket = await ctx.db.supportTicket.findUnique({
					where: { ticket_id: input.ticketId },
					include: { messages: { orderBy: { created_at: "asc" } } },
				});

				if (!ticket || ticket.user_id !== ctx.user.user_id) {
					throw new TRPCError({
						code: "UNAUTHORIZED",
						message: "You are not authorized to view this ticket.",
					});
				}

				return ticket.messages;
			} catch (error) {
				logger.error("support.getTicketMessages", { req: ctx.req, user: ctx.user, input, error });
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to fetch ticket messages",
				});
			}
		}),

	addMessageToTicket: protectedProcedure
		.input(addMessageSchema)
		.mutation(async ({ ctx, input }) => {
			try {
				const ticket = await ctx.db.supportTicket.findUnique({
					where: { ticket_id: input.ticketId },
					select: { user_id: true },
				});

				if (!ticket || ticket.user_id !== ctx.user.user_id) {
					throw new TRPCError({
						code: "UNAUTHORIZED",
						message: "You are not authorized to add messages to this ticket.",
					});
				}

				const newMessage = await ctx.db.supportMessage.create({
					data: {
						ticket_id: input.ticketId,
						sender_id: ctx.user.user_id,
						sender_role: ctx.user.role,
						content: input.content,
					},
				});
				return newMessage;
			} catch (error) {
				logger.error("support.addMessageToTicket", { req: ctx.req, user: ctx.user, input, error });
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to add message to ticket",
				});
			}
		}),

	getAllTickets: adminProcedure
		.input(getAllTicketsSchema)
		.query(async ({ ctx, input }) => {
			try {
				const { status, priority, userId, page, pageSize, startDate, endDate } =
					input;
				const whereClause: Prisma.SupportTicketWhereInput = {};
				if (status) whereClause.status = status;
				if (priority) whereClause.priority = priority;
				if (userId) whereClause.user_id = userId;
				if (startDate && endDate) {
					whereClause.created_at = {
						gte: new Date(startDate),
						lte: getEndOfDay(new Date(endDate)),
					};
				}

				const tickets = await ctx.db.supportTicket.findMany({
					where: whereClause,
					skip: (page - 1) * pageSize,
					take: pageSize,
					orderBy: { created_at: "desc" },
					include: { user: { select: { name: true, email: true } } },
				});

				const totalTickets = await ctx.db.supportTicket.count({
					where: whereClause,
				});

				return { tickets, totalTickets };
			} catch (error) {
				logger.error("support.getAllTickets", { req: ctx.req, user: ctx.user, input, error });
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to fetch all support tickets",
				});
			}
		}),

	getTicketDetails: protectedProcedure
		.input(getTicketDetailsSchema)
		.query(async ({ ctx, input }) => {
			try {
				const ticket = await ctx.db.supportTicket.findUnique({
					where: { ticket_id: input.ticketId },
					select: {
						ticket_id: true,
						user_id: true,
						subject: true,
						description: true,
						status: true,
						priority: true,
						created_at: true,
						updated_at: true,
						resolved_at: true,
						awb: true,
						assigned_to_employee_id: true,
						user: {
							select: {
								user_id: true,
								name: true,
								email: true,
								mobile_number: true,
							},
						},
						messages: { orderBy: { created_at: "asc" } },
						assigned_to: {
							select: { employee_id: true, user: { select: { name: true } } },
						},
					},
				});

				if (!ticket) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "Ticket not found",
					});
				}
				return ticket;
			} catch (error) {
				logger.error("support.getTicketDetails", { req: ctx.req, user: ctx.user, input, error });
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to fetch ticket details",
				});
			}
		}),

	addMessageToTicketAdmin: adminProcedure
		.input(addMessageSchema)
		.mutation(async ({ ctx, input }) => {
			try {
				const ticket = await ctx.db.supportTicket.findUnique({
					where: { ticket_id: input.ticketId },
				});

				if (!ticket) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "Ticket not found",
					});
				}

				const newMessage = await ctx.db.supportMessage.create({
					data: {
						ticket_id: input.ticketId,
						sender_id: ctx.user.user_id,
						sender_role: USER_ROLE.Admin,
						content: input.content,
					},
				});
				return newMessage;
			} catch (error) {
				logger.error("support.addMessageToTicketAdmin", { req: ctx.req, user: ctx.user, input, error });
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to add message to ticket",
				});
			}
		}),

	updateTicketStatus: adminProcedure
		.input(updateTicketStatusSchema)
		.mutation(async ({ ctx, input }) => {
			try {
				const updatedTicket = await ctx.db.supportTicket.update({
					where: { ticket_id: input.ticketId },
					data: {
						status: input.status,
						resolved_at:
							input.status === SUPPORT_STATUS.Closed ? new Date() : null,
					},
				});
				return updatedTicket;
			} catch (error) {
				logger.error("support.updateTicketStatus", { req: ctx.req, user: ctx.user, input, error });
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to update ticket status",
				});
			}
		}),

	updateTicketPriority: adminProcedure
		.input(updateTicketPrioritySchema)
		.mutation(async ({ ctx, input }) => {
			try {
				const updatedTicket = await ctx.db.supportTicket.update({
					where: { ticket_id: input.ticketId },
					data: {
						priority: input.priority,
					},
				});
				return updatedTicket;
			} catch (error) {
				logger.error("Admin failed to update ticket priority", {
					req: ctx.req,
					user: ctx.user,
					input,
					error,
				});
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to update ticket priority",
				});
			}
		}),

	assignTicket: adminProcedure
		.input(assignTicketSchema)
		.mutation(async ({ ctx, input }) => {
			logger.info("Admin assigning ticket", {
				ticketId: input.ticketId,
				employeeId: input.employeeId,
				adminId: ctx.user.user_id,
			});
			try {
				const updatedTicket = await ctx.db.supportTicket.update({
					where: { ticket_id: input.ticketId },
					data: {
						assigned_to_employee_id: input.employeeId,
					},
				});
				logger.info("Ticket assigned successfully by admin", {
					ticketId: updatedTicket.ticket_id,
					assignedTo: updatedTicket.assigned_to_employee_id,
				});
				return updatedTicket;
			} catch (error) {
				logger.error("Admin failed to assign ticket", { error });
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to assign ticket",
				});
			}
		}),
});
