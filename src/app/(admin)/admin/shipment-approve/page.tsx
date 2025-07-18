"use client";

import React, { useState } from "react";
import CopyableId from "~/components/CopyableId";
import { DataTable } from "~/components/DataTable";
import ShipmentDetailsModal from "~/components/ShipmentDetailsModal";
import { Button } from "~/components/ui/button";
import { formatDateToSeconds } from "~/lib/utils";
import { type RouterOutputs, api } from "~/trpc/react";

type ShipmentListItem = RouterOutputs["admin"]["pendingShipments"][number];

const ApproveOrderPage = () => {
	const { data: shipmentList, isLoading } = api.admin.pendingShipments.useQuery(
		undefined,
		{
			retry: 3,
			refetchOnWindowFocus: false,
		},
	);

	const [showOrderDetailsModal, setShowOrderDetailsModal] = useState(false);
	const [selectedShipmentItem, setSelectedShipmentItem] =
		useState<ShipmentListItem | null>(null);

	const [searchFilter, setSearchFilter] = useState("");

	const handleClearFilters = () => {
		setSearchFilter("");
	};

	const filteredData = React.useMemo(() => {
		return ((shipmentList as ShipmentListItem[]) ?? []).filter((item) => {
			const searchLower = searchFilter.toLowerCase();
			return (
				item.user.email.toLowerCase().includes(searchLower) ||
				item.user.name.toLowerCase().includes(searchLower) ||
				item.human_readable_shipment_id.toLowerCase().includes(searchLower)
			);
		});
	}, [shipmentList, searchFilter]);

	const columns = [
		{
			key: "human_readable_shipment_id",
			header: "Shipment ID",
			className: "w-50 px-4",
			render: (item: ShipmentListItem) => (
				<CopyableId id={item.human_readable_shipment_id} />
			),
		},
		{
			key: "user_name",
			header: "Name",
			className: "w-50 px-4",
			render: (item: ShipmentListItem) => item.user.name,
		},
		{
			key: "user_email",
			header: "Email",
			className: "w-70 px-4",
			render: (item: ShipmentListItem) => item.user.email,
		},
		{
			key: "shipping_cost",
			header: "Amount",
			className: "w-50 px-4",
			render: (item: ShipmentListItem) => `₹${item.shipping_cost}`,
		},
		{
			key: "date",
			header: "Created On",
			className: "w-50 px-4",
			render: (item: ShipmentListItem) =>
				item.created_at ? formatDateToSeconds(item.created_at) : "-",
		},
		{
			key: "actions",
			header: "Actions",
			className: "w-50 px-4 text-right",
			render: (item: ShipmentListItem) => (
				<Button
					type="button"
					size="sm"
					variant="default"
					onClick={() => {
						setSelectedShipmentItem(item);
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
				title="Shipment Approval"
				data={filteredData}
				columns={columns}
				filters={filters}
				onClearFilters={handleClearFilters}
				isLoading={isLoading}
				idKey="shipment_id"
				onRowClick={(row: ShipmentListItem) => {
					setSelectedShipmentItem(row);
					setShowOrderDetailsModal(true);
				}}
			/>
			<ShipmentDetailsModal
				isOpen={showOrderDetailsModal}
				onClose={() => setShowOrderDetailsModal(false)}
				shipmentItem={selectedShipmentItem}
			/>
		</>
	);
};

export default ApproveOrderPage;
