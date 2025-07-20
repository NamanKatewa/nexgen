"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { SUPPORT_PRIORITY, SUPPORT_STATUS, USER_ROLE } from "@prisma/client";
import { format } from "date-fns";
import { useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { FieldError } from "~/components/FieldError";
import { Button } from "~/components/ui/button";
import { Textarea } from "~/components/ui/textarea";
import {
	type AddMessageInput,
	type AssignTicketInput,
	type UpdateTicketPriorityInput,
	type UpdateTicketStatusInput,
	addMessageSchema,
	assignTicketSchema,
	updateTicketPrioritySchema,
	updateTicketStatusSchema,
} from "~/schemas/support";
import { api } from "~/trpc/react";

import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "~/components/ui/select";
import { cn } from "~/lib/utils";

export default function AdminTicketDetailsPage() {
	const params = useParams();
	const ticketId = params.ticketId as string;

	const {
		data: ticket,
		isLoading,
		refetch,
	} = api.support.getTicketDetails.useQuery(
		{ ticketId },
		{ enabled: !!ticketId },
	);

	const {
		register: messageRegister,
		handleSubmit: handleMessageSubmit,
		formState: { errors: messageErrors },
		reset: resetMessageForm,
	} = useForm<AddMessageInput>({
		resolver: zodResolver(addMessageSchema),
		defaultValues: { ticketId: ticketId },
	});

	const {
		handleSubmit: handleStatusSubmit,
		control: statusControl,
		register: statusRegister,
	} = useForm<UpdateTicketStatusInput>({
		resolver: zodResolver(updateTicketStatusSchema),
		defaultValues: { ticketId: ticketId, status: ticket?.status },
	});

	const {
		handleSubmit: handlePrioritySubmit,
		control: priorityControl,
		register: priorityRegister,
	} = useForm<UpdateTicketPriorityInput>({
		resolver: zodResolver(updateTicketPrioritySchema),
		defaultValues: { ticketId: ticketId, priority: ticket?.priority },
	});

	const {
		handleSubmit: handleAssignSubmit,
		control: assignControl,
		register: assignRegister,
	} = useForm<AssignTicketInput>({
		resolver: zodResolver(assignTicketSchema),
		defaultValues: {
			ticketId: ticketId,
			employeeId: ticket?.assigned_to_employee_id || null,
		},
	});

	const addMessageMutation = api.support.addMessageToTicketAdmin.useMutation({
		onSuccess: () => {
			toast.success("Message sent!");
			void refetch();
			resetMessageForm();
		},
		onError: (error) => {
			toast.error("Failed to send message", {
				description: error.message,
			});
		},
	});

	const updateStatusMutation = api.support.updateTicketStatus.useMutation({
		onSuccess: () => {
			toast.success("Ticket status updated!");
			void refetch();
		},
		onError: (error) => {
			toast.error("Failed to update status", {
				description: error.message,
			});
		},
	});

	const updatePriorityMutation = api.support.updateTicketPriority.useMutation({
		onSuccess: () => {
			toast.success("Ticket priority updated!");
			void refetch();
		},
		onError: (error) => {
			toast.error("Failed to update priority", {
				description: error.message,
			});
		},
	});

	const assignTicketMutation = api.support.assignTicket.useMutation({
		onSuccess: () => {
			toast.success("Ticket assigned!");
			void refetch();
		},
		onError: (error) => {
			toast.error("Failed to assign ticket", {
				description: error.message,
			});
		},
	});

	const onMessageSubmit = (data: AddMessageInput) => {
		addMessageMutation.mutate(data);
	};

	const onStatusChange = (value: SUPPORT_STATUS) => {
		updateStatusMutation.mutate({ ticketId, status: value });
	};

	const onPriorityChange = (value: SUPPORT_PRIORITY) => {
		updatePriorityMutation.mutate({ ticketId, priority: value });
	};

	const onAssignChange = (value: string) => {
		assignTicketMutation.mutate({
			ticketId,
			employeeId: value === "unassign" ? null : value,
		});
	};

	if (isLoading) {
		return (
			<div className="container mx-auto py-10">Loading ticket details...</div>
		);
	}

	if (!ticket) {
		return <div className="container mx-auto py-10">Ticket not found.</div>;
	}

	return (
		<div className="container mx-auto py-10">
			<h1 className="mb-4 font-bold text-3xl">Ticket: {ticket.subject}</h1>
			<div className="mb-6 rounded-lg bg-white p-6 shadow-md">
				<p className="font-semibold text-lg">
					User: {ticket.user.name} ({ticket.user.email})
				</p>
				<p className="font-semibold text-lg">
					Mobile: {ticket.user.mobile_number}
				</p>
				<div className="mt-2 flex items-center space-x-4">
					<p className="font-semibold text-lg">Status:</p>
					<Select onValueChange={onStatusChange} value={ticket.status}>
						<SelectTrigger className="w-[180px]">
							<SelectValue placeholder="Select Status" />
						</SelectTrigger>
						<SelectContent>
							{Object.values(SUPPORT_STATUS).map((status) => (
								<SelectItem key={status} value={status}>
									{status}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
				<div className="mt-2 flex items-center space-x-4">
					<p className="font-semibold text-lg">Priority:</p>
					<Select onValueChange={onPriorityChange} value={ticket.priority}>
						<SelectTrigger className="w-[180px]">
							<SelectValue placeholder="Select Priority" />
						</SelectTrigger>
						<SelectContent>
							{Object.values(SUPPORT_PRIORITY).map((priority) => (
								<SelectItem key={priority} value={priority}>
									{priority}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
				{/* <div className="mt-2 flex items-center space-x-4">
					<p className="font-semibold text-lg">Assigned To:</p>
					<Select
						onValueChange={onAssignChange}
						value={ticket.assigned_to_employee_id || "unassign"}
					>
						<SelectTrigger className="w-[180px]">
							<SelectValue placeholder="Assign Employee" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="unassign">Unassign</SelectItem>
							<SelectItem value="employee1">Employee 1</SelectItem>
							<SelectItem value="employee2">Employee 2</SelectItem>
						</SelectContent>
					</Select>
				</div> */}
				<p className="mt-2 text-gray-600">
					Created: {format(ticket.created_at, "PPP p")}
				</p>
				{ticket.resolved_at && (
					<p className="text-gray-600">
						Resolved: {format(ticket.resolved_at, "PPP p")}
					</p>
				)}
			</div>

			<div className="mb-6 space-y-4">
				{ticket.messages.map((message) => (
					<div
						key={message.message_id}
						className={cn(
							"rounded-lg p-4",
							message.sender_role === USER_ROLE.Admin
								? "ml-auto bg-blue-100 text-right"
								: "mr-auto bg-gray-100 text-left",
						)}
						style={{
							maxWidth: "75%",
							marginLeft:
								message.sender_role === USER_ROLE.Admin ? "auto" : "0",
							marginRight:
								message.sender_role === USER_ROLE.Admin ? "0" : "auto",
						}}
					>
						<p className="font-semibold">
							{message.sender_role === USER_ROLE.Admin
								? "Admin"
								: ticket.user.name}{" "}
							({(message.sender_role as USER_ROLE).toLowerCase()})
						</p>
						<p>{message.content}</p>
						<p className="mt-1 text-gray-500 text-xs">
							{format(message.created_at, "PPP p")}
						</p>
					</div>
				))}
			</div>

			<form
				onSubmit={handleMessageSubmit(onMessageSubmit)}
				className="space-y-4"
			>
				<div>
					<label htmlFor="content" className="block font-medium text-sm">
						Reply
					</label>
					<Textarea id="content" {...messageRegister("content")} rows={4} />
					{messageErrors.content && (
						<FieldError message={messageErrors.content.message} />
					)}
				</div>
				<Button type="submit" disabled={addMessageMutation.isPending}>
					{addMessageMutation.isPending ? "Sending..." : "Send Reply"}
				</Button>
			</form>
		</div>
	);
}
