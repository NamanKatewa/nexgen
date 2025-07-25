"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import type { SupportTicket } from "@prisma/client";
import Link from "next/link";
import { useState } from "react";
import type { DateRange } from "react-day-picker";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import Copyable from "~/components/Copyable";
import { DataTable } from "~/components/DataTable";
import type { ColumnConfig } from "~/components/DataTable";
import { FieldError } from "~/components/FieldError";
import PaginationButtons from "~/components/PaginationButtons";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { cn } from "~/lib/utils";
import { formatDate } from "~/lib/utils";
import { createTicketSchema } from "~/schemas/support";
import type { CreateTicketInput } from "~/schemas/support";
import { api } from "~/trpc/react";

export default function SupportPage() {
	const [page, setPage] = useState(1);
	const [pageSize, setPageSize] = useState(10);
	const [statusFilter, setStatusFilter] = useState<
		"Open" | "Closed" | undefined
	>(undefined);
	const [priorityFilter, setPriorityFilter] = useState<
		"Low" | "Medium" | "High" | undefined
	>(undefined);
	const [dateRange, setDateRange] = useState<DateRange | undefined>({
		from: undefined,
		to: undefined,
	});
	const [isModalOpen, setIsModalOpen] = useState(false);

	const { data, isLoading, refetch } = api.support.getUserTickets.useQuery({
		page,
		pageSize,
		status: statusFilter,
		priority: priorityFilter,
		startDate: dateRange?.from?.toISOString(),
		endDate: dateRange?.to?.toISOString(),
	});

	const {
		register,
		handleSubmit,
		formState: { errors },
		reset,
	} = useForm<CreateTicketInput>({
		resolver: zodResolver(createTicketSchema),
	});

	const createTicketMutation = api.support.createTicket.useMutation({
		onSuccess: () => {
			toast.success("Support ticket created successfully!");
			void refetch();
			reset();
			setIsModalOpen(false);
		},
		onError: (error) => {
			toast.error("Failed to create ticket", {
				description: error.message,
			});
		},
	});

	const onSubmit = (data: CreateTicketInput) => {
		createTicketMutation.mutate(data);
	};

	const columns: ColumnConfig<SupportTicket>[] = [
		{
			key: "ticket_id",
			header: "Ticket ID",
			className: "w-30 p-4",
			render: (item: SupportTicket) => <Copyable content={item.ticket_id} />,
		},
		{
			key: "subject",
			header: "Subject",
			className: "p-4 w-50 whitespace-normal",
		},
		{
			key: "status",
			header: "Status",
			className: "p-4 w-20 text-center",
			render: (item: SupportTicket) => (
				<Badge
					className={cn("text-blue-950", {
						"bg-green-200": item.status === "Closed",
						"bg-yellow-200": item.status === "Open",
					})}
				>
					{item.status}
				</Badge>
			),
		},
		{
			key: "priority",
			header: "Priority",
			className: "p-4 w-20 text-center",
			render: (item: SupportTicket) => (
				<Badge
					className={cn("text-blue-950", {
						"bg-red-200": item.priority === "High",
						"bg-yellow-200": item.priority === "Medium",
						"bg-green-200": item.priority === "Low",
					})}
				>
					{item.priority}
				</Badge>
			),
		},
		{
			key: "updated_at",
			header: "Last Updated",
			className: "p-4 w-30",
			render: (item: SupportTicket) => formatDate(item.updated_at),
		},
		{
			key: "actions",
			header: "Actions",
			className: "w-30 px-4",
			render: (item: SupportTicket) => (
				<div className="flex flex-col gap-2">
					<Button className="cursor-pointer">
						<Link href={`/dashboard/support/${item.ticket_id}`}>
							View Ticket
						</Link>
					</Button>
				</div>
			),
		},
	];

	const filters = [
		{
			id: "status",
			label: "Status",
			type: "select" as const,
			options: [
				{ label: "All", value: "all" },
				{ label: "Open", value: "Open" },
				{ label: "Closed", value: "Closed" },
			],
			selectedValue: statusFilter || "all",
			onValueChange: (value: string) =>
				setStatusFilter(
					value === "all" ? undefined : (value as "Open" | "Closed"),
				),
		},
		{
			id: "priority",
			label: "Priority",
			type: "select" as const,
			options: [
				{ label: "All", value: "all" },
				{ label: "Low", value: "Low" },
				{ label: "Medium", value: "Medium" },
				{ label: "High", value: "High" },
			],
			selectedValue: priorityFilter || "all",
			onValueChange: (value: string) =>
				setPriorityFilter(
					value === "all" ? undefined : (value as "Low" | "Medium" | "High"),
				),
		},
	];

	const handleClearFilters = () => {
		setStatusFilter(undefined);
		setPriorityFilter(undefined);
		setDateRange({ from: undefined, to: undefined });
	};

	return (
		<>
			<div className="flex p-4">
				<Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
					<DialogTrigger asChild>
						<Button
							className="w-full"
							disabled={createTicketMutation.isPending || isLoading}
						>
							Create New Ticket
						</Button>
					</DialogTrigger>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>Create New Support Ticket</DialogTitle>
							<DialogDescription>
								Fill out the form below to create a new support ticket.
							</DialogDescription>
						</DialogHeader>
						<form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
							<div>
								<label htmlFor="subject" className="block font-medium text-sm">
									Subject
								</label>
								<Input id="subject" {...register("subject")} />
								{errors.subject && (
									<FieldError message={errors.subject.message} />
								)}
							</div>
							<div>
								<label
									htmlFor="description"
									className="block font-medium text-sm"
								>
									Description
								</label>
								<Textarea id="description" {...register("description")} />
								{errors.description && (
									<FieldError message={errors.description.message} />
								)}
							</div>
							<div>
								<label htmlFor="awb" className="block font-medium text-sm">
									AWB (Optional)
								</label>
								<Input id="awb" {...register("awb")} />
								{errors.awb && (
									<FieldError message={errors.awb.message} />
								)}
							</div>
							<Button type="submit" disabled={createTicketMutation.isPending}>
								{createTicketMutation.isPending
									? "Creating..."
									: "Create Ticket"}
							</Button>
						</form>
					</DialogContent>
				</Dialog>
			</div>

			<DataTable
				title="My Support Tickets"
				data={data?.tickets || []}
				columns={columns}
				isLoading={isLoading}
				idKey="ticket_id"
				filters={filters}
				onClearFilters={handleClearFilters}
				dateRange={dateRange}
				onDateRangeChange={setDateRange}
			/>

			<PaginationButtons
				isLoading={isLoading}
				page={page}
				totalPages={Math.ceil((data?.totalTickets ?? 0) / pageSize)}
				setPage={setPage}
			/>
		</>
	);
}
