"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { SUPPORT_STATUS, type USER_ROLE } from "@prisma/client";
import { format } from "date-fns";
import { useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { FieldError } from "~/components/FieldError";
import { Button } from "~/components/ui/button";
import { Textarea } from "~/components/ui/textarea";
import { cn } from "~/lib/utils";
import { type AddMessageInput, addMessageSchema } from "~/schemas/support";
import { api } from "~/trpc/react";

export default function TicketDetailsPage() {
	const params = useParams();
	const ticketId = params.ticketId as string;

	const { data: user, isLoading: userLoading } = api.auth.me.useQuery();

	const {
		data: ticket,
		isLoading: ticketLoading,
		refetch,
	} = api.support.getTicketDetails.useQuery(
		{ ticketId },
		{ enabled: !!ticketId },
	);

	const {
		register,
		handleSubmit,
		formState: { errors },
		reset,
	} = useForm<AddMessageInput>({
		resolver: zodResolver(addMessageSchema),
		defaultValues: { ticketId: ticketId },
	});

	const addMessageMutation = api.support.addMessageToTicket.useMutation({
		onSuccess: () => {
			toast.success("Message sent!");
			void refetch();
			reset();
		},
		onError: (error) => {
			toast.error("Failed to send message", {
				description: error.message,
			});
		},
	});

	const onSubmit = (data: AddMessageInput) => {
		addMessageMutation.mutate(data);
	};

	if (userLoading || ticketLoading) {
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
				<p className="font-semibold text-lg">Status: {ticket.status}</p>
				<p className="font-semibold text-lg">Priority: {ticket.priority}</p>
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
							message.sender_id === user?.id
								? "ml-auto bg-blue-100 text-right"
								: "mr-auto bg-gray-100 text-left",
						)}
						style={{
							maxWidth: "75%",
							marginLeft: message.sender_id === user?.id ? "auto" : "0",
							marginRight: message.sender_id === user?.id ? "0" : "auto",
						}}
					>
						<p className="font-semibold">
							{message.sender_id === user?.id ? "You" : "Admin"} (
							{(message.sender_role as USER_ROLE).toLowerCase()})
						</p>
						<p>{message.content}</p>
						<p className="mt-1 text-gray-500 text-xs">
							{format(message.created_at, "PPP p")}
						</p>
					</div>
				))}
			</div>

			{ticket.status !== SUPPORT_STATUS.Closed && (
				<form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
					<div>
						<label htmlFor="content" className="block font-medium text-sm">
							Your Message
						</label>
						<Textarea id="content" {...register("content")} rows={4} />
						{errors.content && <FieldError message={errors.content.message} />}
					</div>
					<Button type="submit" disabled={addMessageMutation.isPending}>
						{addMessageMutation.isPending ? "Sending..." : "Send Message"}
					</Button>
				</form>
			)}
		</div>
	);
}
