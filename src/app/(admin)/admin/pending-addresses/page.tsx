"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import type { DateRange } from "react-day-picker";
import { toast } from "sonner";
import Copyable from "~/components/Copyable";
import { type ColumnConfig, DataTable } from "~/components/DataTable";
import PaginationButtons from "~/components/PaginationButtons";
import { Button } from "~/components/ui/button";
import useDebounce from "~/lib/hooks/useDebounce";
import { type RouterOutputs, api } from "~/trpc/react";

type PendingAddress =
	RouterOutputs["admin"]["pendingAddresses"]["pendingAddresses"][number];

function PendingAddressesContent() {
	const searchParams = useSearchParams();
	const initialUserId = searchParams.get("userId") || "";
	const [searchText, setSearchText] = useState(initialUserId);
	const debouncedSearchFilter = useDebounce(searchText, 500);
	const [processingAddressId, setProcessingAddressId] = useState<string | null>(
		null,
	);
	const [page, setPage] = useState(1);
	const [pageSize, setPageSize] = useState(10);
	const [dateRange, setDateRange] = useState<DateRange | undefined>({
		from: undefined,
		to: undefined,
	});

	const handleClearFilters = () => {
		setSearchText("");
		setDateRange({ from: undefined, to: undefined });
	};

	const { data, isLoading, refetch } = api.admin.pendingAddresses.useQuery({
		page,
		pageSize,
		searchFilter:
			debouncedSearchFilter === "" ? undefined : debouncedSearchFilter,
		startDate: dateRange?.from?.toISOString(),
		endDate: dateRange?.to?.toISOString(),
	});
	const approveMutation = api.admin.approvePendingAddress.useMutation({
		onMutate: (variables) => {
			setProcessingAddressId(variables.pendingAddressId);
		},
		onSuccess: () => {
			toast.success("Address approved successfully!");
			refetch();
		},
		onError: (error) => {
			toast.error(`Failed to approve address: ${error.message}`);
		},
		onSettled: () => {
			setProcessingAddressId(null);
		},
	});
	const rejectMutation = api.admin.rejectPendingAddress.useMutation({
		onMutate: (variables) => {
			setProcessingAddressId(variables.pendingAddressId);
		},
		onSuccess: () => {
			toast.success("Address rejected successfully!");
			refetch();
		},
		onError: (error) => {
			toast.error(`Failed to reject address: ${error.message}`);
		},
		onSettled: () => {
			setProcessingAddressId(null);
		},
	});

	const columns: ColumnConfig<PendingAddress>[] = [
		{
			key: "pending_address_id",
			header: "Address ID",
			className: "w-30 px-4",
			render: (item: PendingAddress) => (
				<Copyable content={item.pending_address_id} />
			),
		},
		{
			key: "user_name",
			header: "User Name",
			className: "w-40 px-4 whitespace-normal",
			render: (item: PendingAddress) => (
				<Link href={`/admin/user/${item.user_id}`}>{item.user.name}</Link>
			),
		},
		{
			key: "user_email",
			header: "User Email",
			className: "w-40 px-4",
			render: (item: PendingAddress) => <Copyable content={item.user.email} />,
		},
		{
			key: "name",
			header: "Address Name",
			className: "w-40 px-4 whitespace-normal",
			render: (item) => item.name,
		},
		{
			key: "address_line",
			header: "Address Line",
			className: "w-50 px-4 whitespace-normal",
			render: (item) => item.address_line,
		},
		{
			key: "landmark",
			header: "Landmark",
			className: "w-30 px-4 whitespace-normal",
			render: (item: PendingAddress) => item.landmark || "N/A",
		},
		{
			key: "city",
			header: "City",
			className: "w-30 px-4 whitespace-normal",
			render: (item) => item.city,
		},
		{
			key: "state",
			header: "State",
			className: "w-30 px-4 whitespace-normal",
			render: (item) => item.state,
		},
		{
			key: "zip_code",
			header: "Zip Code",
			className: "w-30 px-4 whitespace-normal",
			render: (item) => item.zip_code,
		},
		{
			key: "actions",
			header: "Actions",
			className: "w-30",
			render: (row: PendingAddress) => (
				<div className="flex flex-col gap-2">
					<Button
						className="bg-green-600"
						onClick={() =>
							approveMutation.mutate({
								pendingAddressId: row.pending_address_id,
							})
						}
						disabled={processingAddressId === row.pending_address_id}
					>
						{processingAddressId === row.pending_address_id &&
						approveMutation.isPending
							? "Approving..."
							: "Approve"}
					</Button>
					<Button
						className="bg-red-600"
						onClick={() =>
							rejectMutation.mutate({
								pendingAddressId: row.pending_address_id,
							})
						}
						disabled={processingAddressId === row.pending_address_id}
					>
						{processingAddressId === row.pending_address_id &&
						rejectMutation.isPending
							? "Rejecting..."
							: "Reject"}
					</Button>
				</div>
			),
		},
	];

	return (
		<>
			<DataTable
				title="Pending Pickup Addresses"
				data={data?.pendingAddresses || []}
				columns={columns}
				isLoading={isLoading}
				noResultsMessage="No pending addresses found."
				filters={[
					{
						id: "search",
						label: "Search",
						type: "text",
						value: searchText,
						onChange: setSearchText,
					},
				]}
				dateRange={dateRange}
				onDateRangeChange={setDateRange}
				onClearFilters={handleClearFilters}
			/>

			<PaginationButtons
				isLoading={isLoading}
				page={page}
				totalPages={data?.totalPages || 1}
				setPage={setPage}
			/>
		</>
	);
}

export default function PendingAddressesPage() {
	return (
		<Suspense fallback={<div>Loading...</div>}>
			<PendingAddressesContent />
		</Suspense>
	);
}
