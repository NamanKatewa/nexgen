"use client";

import Link from "next/link";
import { useState } from "react";
import type { DateRange } from "react-day-picker";
import Copyable from "~/components/Copyable";
import { DataTable } from "~/components/DataTable";
import type { ColumnConfig } from "~/components/DataTable";
import PaginationButtons from "~/components/PaginationButtons";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import useDebounce from "~/lib/hooks/useDebounce";
import { formatDate } from "~/lib/utils";
import { cn } from "~/lib/utils";
import { type RouterOutputs, api } from "~/trpc/react";

type User = RouterOutputs["admin"]["getAllUsers"]["users"][number];

export default function AdminUsersPage() {
	const [page, setPage] = useState(1);
	const [pageSize, setPageSize] = useState(10);
	const [searchFilter, setSearchFilter] = useState("");
	const [businessTypeFilter, setBusinessTypeFilter] = useState<
		"Retailer" | "Ecommerce" | "Franchise" | undefined
	>(undefined);
	const [roleFilter, setRoleFilter] = useState<
		"Client" | "Admin" | "Employee" | undefined
	>(undefined);
	const [statusFilter, setStatusFilter] = useState<
		"Active" | "Inactive" | undefined
	>(undefined);
	const debouncedSearchFilter = useDebounce(searchFilter, 500);
	const [dateRange, setDateRange] = useState<DateRange | undefined>({
		from: undefined,
		to: undefined,
	});

	const handleClearFilters = () => {
		setSearchFilter("");
		setBusinessTypeFilter(undefined);
		setRoleFilter(undefined);
		setStatusFilter(undefined);
		setDateRange({ from: undefined, to: undefined });
	};

	const { data, isLoading } = api.admin.getAllUsers.useQuery({
		page,
		pageSize,
		searchFilter:
			debouncedSearchFilter === "" ? undefined : debouncedSearchFilter,
		businessType: businessTypeFilter,
		role: roleFilter,
		status: statusFilter,
		startDate: dateRange?.from?.toISOString(),
		endDate: dateRange?.to?.toISOString(),
	});

	const columns: ColumnConfig<User>[] = [
		{
			key: "user_id",
			header: "User ID",
			className: "w-30 px-4",
			render: (item) => <Copyable content={item.user_id} />,
		},
		{
			key: "name",
			header: "Name",
			className: "w-40 px-4 whitespace-normal",
		},
		{
			key: "email",
			header: "Email",
			className: "w-40 px-4",
			render: (item) => <Copyable content={item.email} />,
		},
		{
			key: "mobile_number",
			header: "Mobile Number",
			className: "w-30 px-4",
		},
		{
			key: "company_name",
			header: "Company Name",
			className: "w-40 px-4 whitespace-normal",
		},
		{
			key: "business_type",
			header: "Business Type",
			className: "w-30 px-4 text-center",
			render: (item: User) => (
				<Badge
					className={cn("text-blue-950", {
						"bg-green-200": item.business_type === "Ecommerce",
						"bg-yellow-200": item.business_type === "Retailer",
						"bg-purple-200": item.business_type === "Franchise",
					})}
				>
					{item.business_type}
				</Badge>
			),
		},
		{
			key: "role",
			header: "Role",
			className: "w-30 px-4 text-center",
			render: (item: User) => (
				<Badge
					className={cn("text-blue-950", {
						"bg-green-200": item.role === "Admin",
						"bg-yellow-200": item.role === "Employee",
						"bg-blue-200": item.role === "Client",
					})}
				>
					{item.role}
				</Badge>
			),
		},
		{
			key: "status",
			header: "Status",
			className: "w-30 px-4 text-center",
			render: (item: User) => (
				<Badge
					className={cn("text-blue-950", {
						"bg-green-200": item.status === "Active",
						"bg-red-200": item.status === "Inactive",
					})}
				>
					{item.status}
				</Badge>
			),
		},
		{
			key: "created_at",
			header: "Created At",
			className: "w-40 px-4",
			render: (item: User) => formatDate(item.created_at),
		},
		{
			key: "actions",
			header: "Actions",
			className: "w-30 px-4",
			render: (item: User) => (
				<div className="flex flex-col gap-2">
					<Button className="cursor-pointer">
						<Link href={`/admin/user/${item.user_id}`}>View User</Link>
					</Button>
				</div>
			),
		},
	];

	const filters = [
		{
			id: "search",
			label: "Search",
			type: "text" as const,
			value: searchFilter,
			onChange: setSearchFilter,
		},
		{
			id: "businessType",
			label: "Business Type",
			type: "select" as const,
			options: [
				{ label: "All", value: "all" },
				{ label: "Retailer", value: "Retailer" },
				{ label: "Ecommerce", value: "Ecommerce" },
				{ label: "Franchise", value: "Franchise" },
			],
			selectedValue: businessTypeFilter || "all",
			onValueChange: (value: string) =>
				setBusinessTypeFilter(
					value === "all"
						? undefined
						: (value as "Retailer" | "Ecommerce" | "Franchise"),
				),
		},
		{
			id: "role",
			label: "Role",
			type: "select" as const,
			options: [
				{ label: "All", value: "all" },
				{ label: "Client", value: "Client" },
				{ label: "Admin", value: "Admin" },
				{ label: "Employee", value: "Employee" },
			],
			selectedValue: roleFilter || "all",
			onValueChange: (value: string) =>
				setRoleFilter(
					value === "all"
						? undefined
						: (value as "Client" | "Admin" | "Employee"),
				),
		},
		{
			id: "status",
			label: "Status",
			type: "select" as const,
			options: [
				{ label: "All", value: "all" },
				{ label: "Active", value: "Active" },
				{ label: "Inactive", value: "Inactive" },
			],
			selectedValue: statusFilter || "all",
			onValueChange: (value: string) =>
				setStatusFilter(
					value === "all" ? undefined : (value as "Active" | "Inactive"),
				),
		},
	];

	return (
		<>
			<DataTable
				title="All Users"
				data={data?.users || []}
				columns={columns}
				filters={filters}
				onClearFilters={handleClearFilters}
				isLoading={isLoading}
				idKey="user_id"
				dateRange={dateRange}
				onDateRangeChange={setDateRange}
			/>
			<PaginationButtons
				page={page}
				totalPages={data?.totalPages || 1}
				setPage={setPage}
			/>
		</>
	);
}
