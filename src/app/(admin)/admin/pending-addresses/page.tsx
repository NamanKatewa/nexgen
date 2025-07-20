"use client";

import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import Copyable from "~/components/Copyable";
import { type ColumnConfig, DataTable } from "~/components/DataTable";
import PaginationButtons from "~/components/PaginationButtons";
import { Button } from "~/components/ui/button";
import useDebounce from "~/lib/hooks/useDebounce";
import { type RouterOutputs, api } from "~/trpc/react";

type PendingAddress =
	RouterOutputs["admin"]["pendingAddresses"]["pendingAddresses"][number];

export default function PendingAddressesPage() {
	const [searchText, setSearchText] = useState("");
	const debouncedSearchFilter = useDebounce(searchText, 500);
	const [processingAddressId, setProcessingAddressId] = useState<string | null>(
		null,
	);

	const [page, setPage] = useState(1);
	const [pageSize, setPageSize] = useState(10);

	const { data, isLoading, refetch } = api.admin.pendingAddresses.useQuery({
		page,
		pageSize,
		searchFilter:
			debouncedSearchFilter === "" ? undefined : debouncedSearchFilter,
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
				<Link href={`{/admin/user/${item.user_id}}`}>{item.user.name}</Link>
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
		},
		{
			key: "address_line",
			header: "Address Line",
			className: "w-50 px-4 whitespace-normal",
		},
		{ key: "city", header: "City", className: "w-30 px-4 whitespace-normal" },
		{ key: "state", header: "State", className: "w-30 px-4 whitespace-normal" },
		{
			key: "zip_code",
			header: "Zip Code",
			className: "w-30 px-4 whitespace-normal",
		},
		{
			key: "actions",
			header: "Actions",
			className: "w-60",
			render: (row: PendingAddress) => (
				<div className="flex gap-2">
					<Button
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
						variant="destructive"
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
				onClearFilters={() => setSearchText("")}
			/>
			<PaginationButtons
				page={page}
				totalPages={data?.totalPages || 1}
				setPage={setPage}
			/>
		</>
	);
}
