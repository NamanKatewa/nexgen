"use client";

import { useState } from "react";
import { toast } from "sonner";
import CopyableId from "~/components/CopyableId";
import { DataTable } from "~/components/DataTable";
import { Button } from "~/components/ui/button";
import { type RouterOutputs, api } from "~/trpc/react";

type PendingAddress =
	RouterOutputs["admin"]["pendingAddresses"]["pendingAddresses"][number];

export default function PendingAddressesPage() {
	const [filter, setFilter] = useState("");
	const [processingAddressId, setProcessingAddressId] = useState<string | null>(
		null,
	);

	const [page, setPage] = useState(1);
	const [pageSize, setPageSize] = useState(10);

	const { data, isLoading, refetch } = api.admin.pendingAddresses.useQuery({
		page,
		pageSize,
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

	const columns = [
		{
			key: "pending_address_id",
			header: "Address ID",
			render: (row: PendingAddress) => (
				<CopyableId id={row.pending_address_id} />
			),
		},
		{
			key: "user_name",
			header: "User Name",
			render: (row: PendingAddress) => row.user.name,
		},
		{
			key: "user_email",
			header: "User Email",
			render: (row: PendingAddress) => row.user.email,
			className: "w-60",
		},
		{ key: "name", header: "Name" },
		{ key: "address_line", header: "Address Line" },
		{ key: "city", header: "City" },
		{ key: "state", header: "State" },
		{ key: "zip_code", header: "Zip Code" },
		{
			key: "actions",
			header: "Actions",
			className: "w-90 text-center",
			render: (row: PendingAddress) => (
				<div className="flex justify-center gap-2">
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

	const filteredAddresses = data?.pendingAddresses?.filter(
		(address) =>
			address.user.name.toLowerCase().includes(filter.toLowerCase()) ||
			address.user.email.toLowerCase().includes(filter.toLowerCase()) ||
			address.name.toLowerCase().includes(filter.toLowerCase()) ||
			address.address_line.toLowerCase().includes(filter.toLowerCase()) ||
			address.city.toLowerCase().includes(filter.toLowerCase()) ||
			address.state.toLowerCase().includes(filter.toLowerCase()) ||
			address.zip_code.toString().includes(filter.toLowerCase()),
	);

	return (
		<div className="p-8">
			<DataTable
				title="Pending Pickup Addresses"
				data={filteredAddresses || []}
				columns={columns}
				isLoading={isLoading}
				noResultsMessage="No pending addresses found."
				filters={[
					{
						id: "search",
						label: "Search",
						type: "text",
						value: filter,
						onChange: setFilter,
					},
				]}
				onClearFilters={() => setFilter("")}
			/>
			<div className="mt-4 flex justify-between">
				<Button
					type="button"
					onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
					disabled={page === 1}
					variant="outline"
					className="px-4 py-2"
				>
					Previous
				</Button>
				<span>
					Page {page} of {data?.totalPages || 1}
				</span>
				<Button
					type="button"
					onClick={() => setPage((prev) => prev + 1)}
					disabled={page === (data?.totalPages || 1)}
					variant="outline"
					className="px-4 py-2"
				>
					Next
				</Button>
			</div>
		</div>
	);
}
