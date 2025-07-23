import { SUPPORT_PRIORITY, SUPPORT_STATUS, USER_ROLE } from "@prisma/client";
import { z } from "zod";

export const createTicketSchema = z.object({
	subject: z.string().min(5, "Subject must be at least 5 characters long"),
	description: z
		.string()
		.min(10, "Description must be at least 10 characters long"),
});

export const addMessageSchema = z.object({
	ticketId: z.string().uuid("Invalid ticket ID"),
	content: z.string().min(1, "Message content cannot be empty"),
});

export const updateTicketStatusSchema = z.object({
	ticketId: z.string().uuid("Invalid ticket ID"),
	status: z.nativeEnum(SUPPORT_STATUS),
});

export const updateTicketPrioritySchema = z.object({
	ticketId: z.string().uuid("Invalid ticket ID"),
	priority: z.nativeEnum(SUPPORT_PRIORITY),
});

export const assignTicketSchema = z.object({
	ticketId: z.string().uuid("Invalid ticket ID"),
	employeeId: z.string().uuid("Invalid employee ID").nullable(),
});

export const getTicketMessagesSchema = z.object({
	ticketId: z.string().uuid("Invalid ticket ID"),
});

export const getTicketDetailsSchema = z.object({
	ticketId: z.string().uuid("Invalid ticket ID"),
});

export const getUserTicketsSchema = z.object({
	page: z.number().min(1).default(1),
	pageSize: z.number().min(1).max(100).default(10),
	status: z.nativeEnum(SUPPORT_STATUS).optional(),
	priority: z.nativeEnum(SUPPORT_PRIORITY).optional(),
	startDate: z.string().optional(),
	endDate: z.string().optional(),
});

export const getAllTicketsSchema = z.object({
	page: z.number().min(1).default(1),
	pageSize: z.number().min(1).max(100).default(10),
	status: z.enum(["Open", "Closed"]).optional(),
	priority: z.enum(["Low", "Medium", "High"]).optional(),
	userId: z.string().optional(),
	startDate: z.string().optional(),
	endDate: z.string().optional(),
});

export type CreateTicketInput = z.infer<typeof createTicketSchema>;
export type AddMessageInput = z.infer<typeof addMessageSchema>;
export type UpdateTicketStatusInput = z.infer<typeof updateTicketStatusSchema>;
export type UpdateTicketPriorityInput = z.infer<
	typeof updateTicketPrioritySchema
>;
export type AssignTicketInput = z.infer<typeof assignTicketSchema>;
export type GetTicketMessagesInput = z.infer<typeof getTicketMessagesSchema>;
export type GetTicketDetailsInput = z.infer<typeof getTicketDetailsSchema>;
export type GetUserTicketsInput = z.infer<typeof getUserTicketsSchema>;
export type GetAllTicketsInput = z.infer<typeof getAllTicketsSchema>;
