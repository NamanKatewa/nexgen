"use client";

import type { SupportTicket } from "@prisma/client";
import Link from "next/link";
import { useState } from "react";
import Copyable from "~/components/Copyable";
import { DataTable } from "~/components/DataTable";
import type { ColumnConfig } from "~/components/DataTable";
import PaginationButtons from "~/components/PaginationButtons";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import useDebounce from "~/lib/hooks/useDebounce";
import { cn } from "~/lib/utils";
import { formatDateToSeconds } from "~/lib/utils";
import { api } from "~/trpc/react";

export default function AdminSupportPage() {
	const [page, setPage] = useState(1);
	const [pageSize, setPageSize] = useState(10);
	const [statusFilter, setStatusFilter] = useState<
		"Open" | "Closed" | undefined
	>(undefined);
	const [priorityFilter, setPriorityFilter] = useState<
		"Low" | "Medium" | "High" | undefined
	>(undefined);
	const [userIdSearchText, setUserIdSearchText] = useState("");
	const debouncedUserIdFilter = useDebounce(userIdSearchText, 500);

	const { data, isLoading } = api.support.getAllTickets.useQuery({
		page,
		pageSize,
		status: statusFilter,
		priority: priorityFilter,
		userId: debouncedUserIdFilter === "" ? undefined : debouncedUserIdFilter,
	});

	const columns: ColumnConfig<
		SupportTicket & { user: { name: string; email: string } }
	>[] = [
		{
			key: "ticket_id",
			header: "Ticket ID",
			className: "w-30 p-4",
			render: (item: SupportTicket) => <Copyable content={item.ticket_id} />,
		},
		{
			key: "user.name",
			header: "User Name",
			className: "p-4 w-40 whitespace-normal",
			render: (
				item: SupportTicket & { user: { name: string; email: string } },
			) => <Link href={`/admin/user/${item.user_id}`}>{item.user.name}</Link>,
		},
		{
			key: "user.email",
			header: "User Email",
			className: "p-4 w-40",
			render: (
				item: SupportTicket & { user: { name: string; email: string } },
			) => <Copyable content={item.user.email} />,
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
			key: "created_at",
			header: "Created At",
			className: "p-4 w-50",
			render: (item: SupportTicket) => formatDateToSeconds(item.created_at),
		},
		{
			key: "updated_at",
			header: "Last Updated",
			className: "p-4 w-50",
			render: (item: SupportTicket) => formatDateToSeconds(item.updated_at),
		},
		{
			key: "actions",
			header: "Actions",
			className: "w-30 px-4",
			render: (item: SupportTicket) => (
				<Button className="cursor-pointer">
					<Link href={`/admin/support/${item.ticket_id}`}>View Ticket</Link>
				</Button>
			),
		},
	];

	const filters = [
		{
			id: "userId",
			label: "User ID",
			type: "text" as const,
			value: userIdSearchText,
			onChange: setUserIdSearchText,
		},
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
			selectedValue: priorityFilter ?? "all",
			onValueChange: (value: string) =>
				setPriorityFilter(
					value === "all" ? undefined : (value as "Low" | "Medium" | "High"),
				),
		},
	];

	const handleClearFilters = () => {
		setStatusFilter(undefined);
		setPriorityFilter(undefined);
		setUserIdSearchText("");
	};

	return (
		<>
			<DataTable
				title="Manage Support Tickets"
				data={data?.tickets || []}
				columns={columns}
				filters={filters}
				onClearFilters={handleClearFilters}
				isLoading={isLoading}
				idKey="ticket_id"
			/>
			<PaginationButtons
				page={page}
				totalPages={Math.ceil((data?.totalTickets ?? 0) / pageSize)}
				setPage={setPage}
			/>
		</>
	);
}
