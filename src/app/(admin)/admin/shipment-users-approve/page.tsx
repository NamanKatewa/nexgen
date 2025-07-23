"use client";

import Link from "next/link";
import { useState } from "react";
import type { DateRange } from "react-day-picker";
import Copyable from "~/components/Copyable";
import { DataTable } from "~/components/DataTable";
import type { ColumnConfig } from "~/components/DataTable";
import PaginationButtons from "~/components/PaginationButtons";
import ShipmentUsersApproveSkeleton from "~/components/skeletons/ShipmentUsersApproveSkeleton";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import useDebounce from "~/lib/hooks/useDebounce";
import { type RouterOutputs, api } from "~/trpc/react";

type User =
	RouterOutputs["admin"]["getUsersWithPendingShipments"]["users"][number];

export default function AdminUsersPage() {
	const [page, setPage] = useState(1);
	const [pageSize, setPageSize] = useState(10);
	const [searchFilter, setSearchFilter] = useState("");
	const [dateRange, setDateRange] = useState<DateRange | undefined>({
		from: undefined,
		to: undefined,
	});

	const handleClearFilters = () => {
		setSearchFilter("");
		setDateRange({ from: undefined, to: undefined });
	};

	const debouncedSearchFilter = useDebounce(searchFilter, 500);

	const { data, isLoading } = api.admin.getUsersWithPendingShipments.useQuery({
		page,
		pageSize,
		searchFilter:
			debouncedSearchFilter === "" ? undefined : debouncedSearchFilter,
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
			className: "w-50 px-4 whitespace-normal",
		},
		{
			key: "email",
			header: "Email",
			className: "w-50 px-4",
			render: (item) => <Copyable content={item.email} />,
		},
		{
			key: "mobile_number",
			header: "Mobile Number",
			className: "w-40 px-4",
		},
		{
			key: "pendingShipmentCount",
			header: "Shipments Pending",
			className: "w-40 px-4 whitespace-normal text-center",
			render: (item: User) => <Badge>{item.pendingShipmentCount}</Badge>,
		},
		{
			key: "actions",
			header: "Actions",
			className: "w-60 px-4 text-center",
			render: (item: User) => (
				<div className="flex flex-col items-center gap-2">
					<Button className="cursor-pointer">
						<Link href={`/admin/shipment-approve?userId=${item.user_id}`}>
							View Pending Shipments
						</Link>
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
	];

	return (
		<>
			{isLoading ? (
				<ShipmentUsersApproveSkeleton />
			) : (
				<DataTable
					title="Users"
					data={data?.users || []}
					columns={columns}
					filters={filters}
					onClearFilters={handleClearFilters}
					isLoading={isLoading}
					idKey="user_id"
					dateRange={dateRange}
					onDateRangeChange={setDateRange}
				/>
			)}
			<PaginationButtons
				page={page}
				totalPages={data?.totalPages || 1}
				setPage={setPage}
			/>
		</>
	);
}
