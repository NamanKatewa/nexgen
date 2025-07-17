"use client";

import React, { useState } from "react";
import { DataTable } from "~/components/DataTable";
import OrderDetailsModal from "~/components/OrderDetailsModal";
import { Button } from "~/components/ui/button";
import { type RouterOutputs, api } from "~/trpc/react";
import { formatDateToSeconds } from "~/lib/utils";

type OrderListItem = RouterOutputs["admin"]["pendingOrders"][number];

const ApproveOrderPage = () => {
	const { data: orderList, isLoading } = api.admin.pendingOrders.useQuery(
		undefined,
		{
			retry: 3,
			refetchOnWindowFocus: false,
		},
	);

	const [showOrderDetailsModal, setShowOrderDetailsModal] = useState(false);
	const [selectedOrderItem, setSelectedOrderItem] =
		useState<OrderListItem | null>(null);

	const [searchFilter, setSearchFilter] = useState("");

	const handleClearFilters = () => {
		setSearchFilter("");
	};

	const filteredData = React.useMemo(() => {
		return ((orderList as OrderListItem[]) ?? []).filter((item) => {
			const searchLower = searchFilter.toLowerCase();
			return (
				item.user.email.toLowerCase().includes(searchLower) ||
				item.user.name.toLowerCase().includes(searchLower) ||
				item.order_id.toLowerCase().includes(searchLower)
			);
		});
	}, [orderList, searchFilter]);

	const columns = [
		{
			key: "user_name",
			header: "Name",
			className: "w-50 px-4",
			render: (item: OrderListItem) => item.user.name,
		},
		{
			key: "user_email",
			header: "Email",
			className: "w-70 px-4",
			render: (item: OrderListItem) => item.user.email,
		},
		{
			key: "total_amount",
			header: "Amount",
			className: "w-50 px-4",
			render: (item: OrderListItem) => `₹${item.total_amount}`,
		},
		{
			key: "date",
			header: "Created On",
			className: "w-50 px-4",
			render: (item: OrderListItem) =>
				item.created_at ? formatDateToSeconds(item.created_at) : "-",
		},
		{
			key: "actions",
			header: "Actions",
			className: "w-50 px-4 text-right",
			render: (item: OrderListItem) => (
				<Button
					type="button"
					size="sm"
					variant="default"
					onClick={() => {
						setSelectedOrderItem(item);
						setShowOrderDetailsModal(true);
					}}
					className="cursor-pointer"
				>
					View Details
				</Button>
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
			<DataTable
				title="Order Approval"
				data={filteredData}
				columns={columns}
				filters={filters}
				onClearFilters={handleClearFilters}
				isLoading={isLoading}
				idKey="order_id"
				onRowClick={(row: OrderListItem) => {
					setSelectedOrderItem(row);
					setShowOrderDetailsModal(true);
				}}
			/>
			<OrderDetailsModal
				isOpen={showOrderDetailsModal}
				onClose={() => setShowOrderDetailsModal(false)}
				orderItem={selectedOrderItem}
			/>
		</>
	);
};

export default ApproveOrderPage;
