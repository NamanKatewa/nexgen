import Image from "next/image";
import Link from "next/link";
import type React from "react";
import { Button } from "~/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "~/components/ui/dialog";
import { formatDateToSeconds } from "~/lib/utils";
import type { RouterOutputs } from "~/trpc/react";

type ShipmentItemType =
	RouterOutputs["admin"]["pendingOrders"][number]["shipments"][number];

interface ShipmentDetailsModalProps {
	isOpen: boolean;
	onClose: () => void;
	shipment: ShipmentItemType | null;
}

const ShipmentDetailsModal: React.FC<ShipmentDetailsModalProps> = ({
	isOpen,
	onClose,
	shipment,
}) => {
	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className="sm:max-w-[425px]">
				<DialogHeader>
					<DialogTitle>Shipment Details</DialogTitle>
					<DialogDescription>
						Details of the selected shipment.
					</DialogDescription>
				</DialogHeader>
				{shipment && (
					<div className="grid gap-4 py-4">
						<p>ID: {shipment.human_readable_shipment_id}</p>
						<p>AWB Number: {shipment.awb_number || "N/A"}</p>
						<p>Recipient Name: {shipment.recipient_name}</p>
						<p>Recipient Mobile: {shipment.recipient_mobile}</p>
						<p>Package Weight: {shipment.package_weight.toString()}</p>
						<p>Shipping Cost: ₹{shipment.shipping_cost.toString()}</p>
						{shipment.declared_value && (
							<p>Declared Value: ₹{shipment.declared_value.toString()}</p>
						)}
						<p>
							Insurance Selected:{" "}
							{shipment.is_insurance_selected ? "Yes" : "No"}
						</p>
						{shipment.insurance_premium && (
							<p>Insurance Premium: ₹{shipment.insurance_premium.toString()}</p>
						)}
						{shipment.compensation_amount && (
							<p>
								Compensation Amount: ₹{shipment.compensation_amount.toString()}
							</p>
						)}
						<p>Package Dimensions: {shipment.package_dimensions}</p>
						{shipment.invoiceUrl && (
							<p>
								Invoice:{" "}
								<Link
									href={shipment.invoiceUrl}
									target="_blank"
									className="text-blue-500 hover:underline"
								>
									View Invoice
								</Link>
							</p>
						)}
						<b>
							<p>From:</p>
						</b>
						<p>
							{shipment.origin_address.address_line},{" "}
							{shipment.origin_address.city}, {shipment.origin_address.state} -{" "}
							{shipment.origin_address.zip_code}
						</p>
						<b>
							<p>To:</p>
						</b>
						<p>
							{shipment.destination_address.address_line},{" "}
							{shipment.destination_address.city},{" "}
							{shipment.destination_address.state} -{" "}
							{shipment.destination_address.zip_code}
						</p>
						<Image
							src={shipment.package_image_url}
							alt="Shipment Weight Image"
							width={500}
							height={500}
						/>
					</div>
				)}
				<Button onClick={onClose}>Close</Button>
			</DialogContent>
		</Dialog>
	);
};

export default ShipmentDetailsModal;
