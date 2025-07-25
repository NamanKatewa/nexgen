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
			logger.info("Creating new support ticket", {
				userId: ctx.user.user_id,
				subject: input.subject,
				awb: input.awb,
			});
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
				logger.info("Support ticket created successfully", {
					ticketId: newTicket.ticket_id,
				});
				return newTicket;
			} catch (error) {
				logger.error("Failed to create support ticket", { error });
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to create support ticket",
				});
			}
		}),

	getUserTickets: protectedProcedure
		.input(getUserTicketsSchema)
		.query(async ({ ctx, input }) => {
			logger.info("Fetching user support tickets", {
				userId: ctx.user.user_id,
				input,
			});
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
					include: { messages: { orderBy: { created_at: "desc" }, take: 1 } }, // Get last message
				});

				const totalTickets = await ctx.db.supportTicket.count({
					where: whereClause,
				});

				logger.info("User support tickets fetched successfully", {
					userId: ctx.user.user_id,
					count: tickets.length,
				});
				return { tickets, totalTickets };
			} catch (error) {
				logger.error("Failed to fetch user support tickets", { error });
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to fetch user support tickets",
				});
			}
		}),

	getTicketMessages: protectedProcedure
		.input(getTicketMessagesSchema)
		.query(async ({ ctx, input }) => {
			logger.info("Fetching messages for ticket", {
				ticketId: input.ticketId,
				userId: ctx.user.user_id,
			});
			try {
				const ticket = await ctx.db.supportTicket.findUnique({
					where: { ticket_id: input.ticketId },
					include: { messages: { orderBy: { created_at: "asc" } } },
				});

				if (!ticket || ticket.user_id !== ctx.user.user_id) {
					logger.warn("Unauthorized access to ticket messages", {
						ticketId: input.ticketId,
						userId: ctx.user.user_id,
					});
					throw new TRPCError({
						code: "UNAUTHORIZED",
						message: "You are not authorized to view this ticket.",
					});
				}
				logger.info("Ticket messages fetched successfully", {
					ticketId: input.ticketId,
				});
				return ticket.messages;
			} catch (error) {
				logger.error("Failed to fetch ticket messages", { error });
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to fetch ticket messages",
				});
			}
		}),

	addMessageToTicket: protectedProcedure
		.input(addMessageSchema)
		.mutation(async ({ ctx, input }) => {
			logger.info("Adding message to ticket", {
				ticketId: input.ticketId,
				userId: ctx.user.user_id,
			});
			try {
				const ticket = await ctx.db.supportTicket.findUnique({
					where: { ticket_id: input.ticketId },
				});

				if (!ticket || ticket.user_id !== ctx.user.user_id) {
					logger.warn("Unauthorized attempt to add message to ticket", {
						ticketId: input.ticketId,
						userId: ctx.user.user_id,
					});
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
				logger.info("Message added to ticket successfully", {
					messageId: newMessage.message_id,
					ticketId: input.ticketId,
				});
				return newMessage;
			} catch (error) {
				logger.error("Failed to add message to ticket", { error });
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to add message to ticket",
				});
			}
		}),

	getAllTickets: adminProcedure
		.input(getAllTicketsSchema)
		.query(async ({ ctx, input }) => {
			logger.info("Admin fetching all support tickets", {
				adminId: ctx.user.user_id,
				input,
			});
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

				logger.info("All support tickets fetched successfully by admin", {
					adminId: ctx.user.user_id,
					count: tickets.length,
				});
				return { tickets, totalTickets };
			} catch (error) {
				logger.error("Admin failed to fetch all support tickets", { error });
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to fetch all support tickets",
				});
			}
		}),

	getTicketDetails: protectedProcedure
		.input(getTicketDetailsSchema)
		.query(async ({ ctx, input }) => {
			logger.info("Fetching ticket details", {
				ticketId: input.ticketId,
				adminId: ctx.user.user_id,
			});
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
					logger.warn("Ticket not found for admin", {
						ticketId: input.ticketId,
						adminId: ctx.user.user_id,
					});
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "Ticket not found",
					});
				}
				logger.info("Ticket details fetched successfully by admin", {
					ticketId: input.ticketId,
				});
				return ticket;
			} catch (error) {
				logger.error("Admin failed to fetch ticket details", { error });
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to fetch ticket details",
				});
			}
		}),

	addMessageToTicketAdmin: adminProcedure
		.input(addMessageSchema)
		.mutation(async ({ ctx, input }) => {
			logger.info("Admin adding message to ticket", {
				ticketId: input.ticketId,
				adminId: ctx.user.user_id,
			});
			try {
				const ticket = await ctx.db.supportTicket.findUnique({
					where: { ticket_id: input.ticketId },
				});

				if (!ticket) {
					logger.warn("Ticket not found for admin message addition", {
						ticketId: input.ticketId,
						adminId: ctx.user.user_id,
					});
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
				logger.info("Admin message added to ticket successfully", {
					messageId: newMessage.message_id,
					ticketId: input.ticketId,
				});
				return newMessage;
			} catch (error) {
				logger.error("Admin failed to add message to ticket", { error });
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to add message to ticket",
				});
			}
		}),

	updateTicketStatus: adminProcedure
		.input(updateTicketStatusSchema)
		.mutation(async ({ ctx, input }) => {
			logger.info("Admin updating ticket status", {
				ticketId: input.ticketId,
				status: input.status,
				adminId: ctx.user.user_id,
			});
			try {
				const updatedTicket = await ctx.db.supportTicket.update({
					where: { ticket_id: input.ticketId },
					data: {
						status: input.status,
						resolved_at:
							input.status === SUPPORT_STATUS.Closed ? new Date() : null,
					},
				});
				logger.info("Ticket status updated successfully by admin", {
					ticketId: updatedTicket.ticket_id,
					newStatus: updatedTicket.status,
				});
				return updatedTicket;
			} catch (error) {
				logger.error("Admin failed to update ticket status", { error });
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to update ticket status",
				});
			}
		}),

	updateTicketPriority: adminProcedure
		.input(updateTicketPrioritySchema)
		.mutation(async ({ ctx, input }) => {
			logger.info("Admin updating ticket priority", {
				ticketId: input.ticketId,
				priority: input.priority,
				adminId: ctx.user.user_id,
			});
			try {
				const updatedTicket = await ctx.db.supportTicket.update({
					where: { ticket_id: input.ticketId },
					data: {
						priority: input.priority,
					},
				});
				logger.info("Ticket priority updated successfully by admin", {
					ticketId: updatedTicket.ticket_id,
					newPriority: updatedTicket.priority,
				});
				return updatedTicket;
			} catch (error) {
				logger.error("Admin failed to update ticket priority", { error });
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
