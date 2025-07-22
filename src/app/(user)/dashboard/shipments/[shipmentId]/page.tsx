"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Separator } from "~/components/ui/separator";

import { generateAndDownloadLabel } from "~/lib/pdf-generator";
import { cn, formatDate } from "~/lib/utils";
import { api } from "~/trpc/react";
import type { RouterOutputs } from "~/trpc/react";

type ShipmentItemType = RouterOutputs["shipment"]["getShipmentById"];

export default function UserShipmentDetailPage() {
	const params = useParams();
	const shipmentId = params.shipmentId as string;

	const {
		data: shipment,
		isLoading,
		error,
	} = api.shipment.getShipmentById.useQuery({ shipmentId });

	const { mutateAsync: generateLabelMutation } =
		api.label.generateLabel.useMutation();

	const handleDownloadLabel = async (shipmentId: string) => {
		try {
			await generateAndDownloadLabel(shipmentId, generateLabelMutation);
		} catch (error) {
			toast.error("Failed to generate label");
		}
	};

	if (isLoading) {
		return <div className="p-8">Loading shipment details...</div>;
	}

	if (error) {
		return <div className="p-8 text-red-500">Error: {error.message}</div>;
	}

	if (!shipment) {
		return <div className="p-8">Shipment not found.</div>;
	}

	return (
		<div className="p-8">
			<h1 className="mb-6 font-bold text-3xl">
				Shipment Details - {shipment.human_readable_shipment_id}
			</h1>
			{shipment.awb_number && shipment.shipment_status === "Approved" && (
				<>
					<Button
						onClick={() => handleDownloadLabel(shipment.shipment_id)}
						className="my-4 w-full"
					>
						Download Label
					</Button>
					<Button className="my-4 w-full">
						<Link href={`/track/${shipment.human_readable_shipment_id}`}>
							Track Shipment
						</Link>
					</Button>
				</>
			)}
			<Card className="mb-6">
				<CardHeader>
					<CardTitle>Shipment Summary</CardTitle>
				</CardHeader>
				<CardContent className="grid gap-4">
					<div className="grid grid-cols-2 items-center gap-2">
						<p className="font-medium text-sm">User:</p>
						<p className="text-sm">
							{shipment.user.name} ({shipment.user.email})
						</p>
						<p className="font-medium text-sm">Total Amount:</p>
						<p className="text-sm">
							₹{Number(shipment.shipping_cost).toFixed(2)}
						</p>
						<p className="font-medium text-sm">Shipment Status:</p>
						<Badge
							className={cn("w-fit text-blue-950", {
								"bg-green-200": shipment.shipment_status === "Approved",
								"bg-yellow-200": shipment.shipment_status === "PendingApproval",
								"bg-red-200": shipment.shipment_status === "Rejected",
							})}
						>
							{shipment.shipment_status}
						</Badge>
						<p className="font-medium text-sm">Payment Status:</p>
						<Badge
							className={cn("w-fit text-blue-950", {
								"bg-green-200": shipment.payment_status === "Paid",
								"bg-yellow-200": shipment.payment_status === "Pending",
							})}
						>
							{shipment.payment_status}
						</Badge>
						<p className="font-medium text-sm">Created At:</p>
						<p className="text-sm">{formatDate(shipment.created_at)}</p>
						{shipment.rejection_reason && (
							<>
								<p className="font-medium text-red-500 text-sm">
									Rejection Reason:
								</p>
								<p className="text-red-500 text-sm">
									{shipment.rejection_reason}
								</p>
							</>
						)}
						<p className="font-medium text-sm">AWB Number:</p>
						<p className="text-sm">{shipment.awb_number || "N/A"}</p>
					</div>

					<Separator className="my-4" />

					<h3 className="mb-2 font-semibold text-lg">Package Details</h3>
					<div className="grid grid-cols-2 items-center gap-2">
						<p className="font-medium text-sm">Recipient:</p>
						<p className="text-sm">{shipment.recipient_name}</p>
						<p className="font-medium text-sm">Recipient Mobile:</p>
						<p className="text-sm">{shipment.recipient_mobile}</p>
						<p className="font-medium text-sm">Package Weight:</p>
						<p className="text-sm">
							{Number(shipment.package_weight).toFixed(2)} Kg
						</p>
						<p className="font-medium text-sm">Package Dimensions:</p>
						<p className="text-sm">{shipment.package_dimensions}</p>
					</div>
					{shipment.package_image_url && (
						<div className="mt-4">
							<p className="mb-2 font-medium text-sm">Package Image:</p>
							<Link
								href={shipment.package_image_url}
								target="_blank"
								rel="noopener noreferrer"
							>
								<img
									src={shipment.package_image_url}
									alt="Package"
									className="h-48 w-48 rounded-md object-cover"
								/>
							</Link>
						</div>
					)}
					<Separator className="my-4" />

					<h3 className="mb-2 font-semibold text-lg">Addresses</h3>
					<div className="grid grid-cols-2 gap-4">
						<div>
							<p className="font-medium text-sm">Origin Address:</p>
							<p className="text-sm">
								{shipment.origin_address.address_line},{" "}
								{shipment.origin_address.landmark && (
									<>{shipment.origin_address.landmark}, </>
								)}
								{shipment.origin_address.city},{shipment.origin_address.state} -{" "}
								{shipment.origin_address.zip_code}
							</p>
						</div>
						<div>
							<p className="font-medium text-sm">Destination Address:</p>
							<p className="text-sm">
								{shipment.destination_address.address_line},
								{shipment.destination_address.landmark && (
									<>{shipment.destination_address.landmark},</>
								)}
								{shipment.destination_address.city},
								{shipment.destination_address.state} -{" "}
								{shipment.destination_address.zip_code}
							</p>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
