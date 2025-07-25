"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { SUPPORT_PRIORITY, SUPPORT_STATUS, USER_ROLE } from "@prisma/client";
import { format } from "date-fns";
import { useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { FieldError } from "~/components/FieldError";
import { Badge } from "~/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Skeleton } from "~/components/ui/skeleton";
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

import { nanoid } from "nanoid";
import Link from "next/link";
import { Fragment } from "react";
import { Button } from "~/components/ui/button";
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
			<div className="p-8">
				<Skeleton className="mb-6 h-8 w-1/2" />

				<Card className="mb-6">
					<CardHeader>
						<CardTitle>
							<Skeleton className="h-6 w-1/4" />
						</CardTitle>
					</CardHeader>
					<CardContent className="grid gap-4">
						<div className="grid grid-cols-2 items-center gap-2">
							{[...Array(6)].map(() => (
								<Fragment key={nanoid()}>
									<Skeleton className="h-5 w-1/3" />
									<Skeleton className="h-5 w-2/3" />
								</Fragment>
							))}
						</div>
					</CardContent>
				</Card>

				<Card className="mb-6">
					<CardHeader>
						<CardTitle>
							<Skeleton className="h-6 w-1/4" />
						</CardTitle>
					</CardHeader>
					<CardContent className="grid gap-4">
						<div className="grid grid-cols-2 items-center gap-2">
							{[...Array(3)].map(() => (
								<Fragment key={nanoid()}>
									<Skeleton className="h-15 w-1/3" />
									<Skeleton className="h-15 w-2/3" />
								</Fragment>
							))}
						</div>
					</CardContent>
				</Card>

				<Card className="mb-6">
					<CardHeader>
						<CardTitle>
							<Skeleton className="h-6 w-1/4" />
						</CardTitle>
					</CardHeader>
					<CardContent className="grid gap-4">
						<Skeleton className="h-24 w-full" />
						<Skeleton className="h-10 w-full" />
					</CardContent>
				</Card>
			</div>
		);
	}

	if (!ticket) {
		return <div className="container mx-auto py-10">Ticket not found.</div>;
	}

	return (
		<div className="container mx-auto p-10">
			<h1 className="mb-6 font-bold text-3xl">Ticket: {ticket.subject}</h1>

			<Card className="mb-6">
				<CardHeader>
					<CardTitle>Ticket Information</CardTitle>
				</CardHeader>
				<CardContent className="grid gap-4">
					<div className="grid grid-cols-2 items-center gap-2">
						<p className="font-medium text-sm">User:</p>
						<Link href={`/admin/user/${ticket.user_id}`}>
							<p className="text-sm">
								{ticket.user.name} ({ticket.user.email})
							</p>
						</Link>
						<p className="font-medium text-sm">Mobile:</p>
						<p className="text-sm">{ticket.user.mobile_number}</p>
						<p className="font-medium text-sm">Status:</p>
						<div className="flex w-70 items-center justify-between gap-2">
							<Badge
								className={cn("text-blue-950", {
									"bg-green-200": ticket.status === "Closed",
									"bg-yellow-200": ticket.status === "Open",
								})}
							>
								{ticket.status}
							</Badge>
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
						<p className="font-medium text-sm">Priority:</p>
						<div className="flex w-70 items-center justify-between gap-2">
							<Badge
								className={cn("text-blue-950", {
									"bg-red-200": ticket.priority === "High",
									"bg-yellow-200": ticket.priority === "Medium",
									"bg-green-200": ticket.priority === "Low",
								})}
							>
								{ticket.priority}
							</Badge>
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
						<p className="font-medium text-sm">Created:</p>
						<p className="text-sm">{format(ticket.created_at, "PPP p")}</p>
						{ticket.resolved_at && (
							<>
								<p className="font-medium text-sm">Resolved:</p>
								<p className="text-sm">{format(ticket.resolved_at, "PPP p")}</p>
							</>
						)}
					</div>
				</CardContent>
			</Card>

			<Card className="mb-6">
				<CardHeader>
					<CardTitle>Messages</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					{ticket.messages.map((message) => (
						<div
							key={message.message_id}
							className={cn(
								"max-w-1/3 rounded-lg p-4 text-blue-950",
								message.sender_role === USER_ROLE.Admin
									? "ml-auto bg-blue-100 text-right"
									: "mr-auto bg-gray-100 text-left",
							)}
						>
							<p>{message.content}</p>
							<p className="mt-1 text-xs">
								{format(message.created_at, "PPP p")}
							</p>
						</div>
					))}
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Reply</CardTitle>
				</CardHeader>
				<CardContent>
					<form
						onSubmit={handleMessageSubmit(onMessageSubmit)}
						className="space-y-4"
					>
						<div>
							<Textarea
								id="content"
								{...messageRegister("content")}
								rows={4}
								placeholder="Type your reply here..."
							/>
							{messageErrors.content && (
								<FieldError message={messageErrors.content.message} />
							)}
						</div>
						<Button type="submit" disabled={addMessageMutation.isPending}>
							{addMessageMutation.isPending ? "Sending..." : "Send Reply"}
						</Button>
					</form>
				</CardContent>
			</Card>
		</div>
	);
}
