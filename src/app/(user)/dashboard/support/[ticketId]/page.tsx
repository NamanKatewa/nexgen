"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { SUPPORT_STATUS, type USER_ROLE } from "@prisma/client";
import { format } from "date-fns";
import { nanoid } from "nanoid";
import { useParams } from "next/navigation";
import { Fragment } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { FieldError } from "~/components/FieldError";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Skeleton } from "~/components/ui/skeleton";
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
							{[...Array(4)].map(() => (
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
						<div className="grid grid-cols-1 gap-4">
							{[...Array(3)].map(() => (
								<Fragment key={nanoid()}>
									<Skeleton className="h-15 w-full" />
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
						<p className="font-medium text-sm">Status:</p>
						<Badge
							className={cn("w-fit text-blue-950", {
								"bg-green-200": ticket.status === "Closed",
								"bg-yellow-200": ticket.status === "Open",
							})}
						>
							{ticket.status}
						</Badge>
						<p className="font-medium text-sm">Priority:</p>
						<Badge
							className={cn("w-fit text-blue-950", {
								"bg-red-200": ticket.priority === "High",
								"bg-yellow-200": ticket.priority === "Medium",
								"bg-green-200": ticket.priority === "Low",
							})}
						>
							{ticket.priority}
						</Badge>
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
								"rounded-lg p-4",
								message.sender_id === user?.id
									? "ml-auto bg-blue-100 text-right"
									: "mr-auto bg-gray-100 text-left",
							)}
							style={{ maxWidth: "75%" }}
						>
							<p className="font-semibold">
								{message.sender_id === user?.id ? "You" : "Admin"}
							</p>
							<p>{message.content}</p>
							<p className="mt-1 text-gray-500 text-xs">
								{format(message.created_at, "PPP p")}
							</p>
						</div>
					))}
				</CardContent>
			</Card>

			{ticket.status !== SUPPORT_STATUS.Closed && (
				<Card>
					<CardHeader>
						<CardTitle>Reply</CardTitle>
					</CardHeader>
					<CardContent>
						<form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
							<div>
								<Textarea
									id="content"
									{...register("content")}
									rows={4}
									placeholder="Type your reply here..."
								/>
								{errors.content && (
									<FieldError message={errors.content.message} />
								)}
							</div>
							<Button type="submit" disabled={addMessageMutation.isPending}>
								{addMessageMutation.isPending ? "Sending..." : "Send Reply"}
							</Button>
						</form>
					</CardContent>
				</Card>
			)}
		</div>
	);
}
