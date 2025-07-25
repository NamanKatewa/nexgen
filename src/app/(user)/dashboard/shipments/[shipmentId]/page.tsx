"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { toast } from "sonner";

import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Skeleton } from "~/components/ui/skeleton";
import { generateAndDownloadLabel } from "~/lib/pdf-generator";
import { cn, formatDate } from "~/lib/utils";
import { api } from "~/trpc/react";

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
		return (
			<Skeleton className="w-full p-8">
				<h1 className="mb-6 font-bold text-3xl">
					Shipment Details - {shipmentId}
				</h1>
				<div className="grid grid-cols-1 gap-6 md:grid-cols-2">
					<Card>
						<CardHeader>
							<CardTitle>Shipment Details</CardTitle>
						</CardHeader>
						<CardContent className="grid gap-4">
							<div className="grid grid-cols-2 items-center gap-2">
								<Skeleton className="h-8 w-full" />
								<Skeleton className="h-8 w-full" />
								<Skeleton className="h-8 w-full" />
								<Skeleton className="h-8 w-full" />
								<Skeleton className="h-8 w-full" />
								<Skeleton className="h-8 w-full" />
								<Skeleton className="h-8 w-full" />
								<Skeleton className="h-8 w-full" />
								<Skeleton className="h-8 w-full" />
								<Skeleton className="h-8 w-full" />
								<Skeleton className="h-8 w-full" />
								<Skeleton className="h-8 w-full" />
								<Skeleton className="h-8 w-full" />
								<Skeleton className="h-8 w-full" />
							</div>
						</CardContent>
					</Card>
					<Card>
						<CardHeader>
							<CardTitle>Origin Address</CardTitle>
						</CardHeader>
						<CardContent className="grid gap-4">
							<div className="grid grid-cols-2 items-center gap-2 text-sm">
								<Skeleton className="h-8 w-full" />
								<Skeleton className="h-8 w-full" />
								<Skeleton className="h-8 w-full" />
								<Skeleton className="h-8 w-full" />
								<Skeleton className="h-8 w-full" />
								<Skeleton className="h-8 w-full" />
								<Skeleton className="h-8 w-full" />
								<Skeleton className="h-8 w-full" />
								<Skeleton className="h-8 w-full" />
								<Skeleton className="h-8 w-full" />
							</div>
						</CardContent>
					</Card>
					<Card>
						<CardHeader>
							<CardTitle>Destination Address</CardTitle>
						</CardHeader>
						<CardContent className="grid gap-4">
							<div className="grid grid-cols-2 items-center gap-2 text-sm">
								<Skeleton className="h-8 w-full" />
								<Skeleton className="h-8 w-full" />
								<Skeleton className="h-8 w-full" />
								<Skeleton className="h-8 w-full" />
								<Skeleton className="h-8 w-full" />
								<Skeleton className="h-8 w-full" />
								<Skeleton className="h-8 w-full" />
								<Skeleton className="h-8 w-full" />
								<Skeleton className="h-8 w-full" />
								<Skeleton className="h-8 w-full" />
							</div>
						</CardContent>
					</Card>
					<Card>
						<CardHeader>
							<CardTitle>Recipient Details</CardTitle>
						</CardHeader>
						<CardContent className="grid gap-4">
							<div className="grid grid-cols-2 items-center gap-2">
								<Skeleton className="h-8 w-full" />
								<Skeleton className="h-8 w-full" />
								<Skeleton className="h-8 w-full" />
								<Skeleton className="h-8 w-full" />
							</div>
						</CardContent>
					</Card>
					<Card>
						<CardHeader>
							<CardTitle>Package Details</CardTitle>
						</CardHeader>
						<CardContent className="grid gap-4">
							<div className="grid grid-cols-2 items-center gap-2">
								<Skeleton className="h-8 w-full" />
								<Skeleton className="h-8 w-full" />
								<Skeleton className="h-8 w-full" />
								<Skeleton className="h-8 w-full" />
								<Skeleton className="h-8 w-full" />
								<Skeleton className="h-8 w-full" />
								<Skeleton className="h-8 w-full" />
								<Skeleton className="h-8 w-full" />
								<Skeleton className="h-8 w-full" />
								<Skeleton className="h-48 w-48" />
								<Skeleton className="h-8 w-full" />
								<Skeleton className="h-48 w-48" />
							</div>
						</CardContent>
					</Card>
				</div>
			</Skeleton>
		);
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
				<div className="my-4 flex flex-col gap-2">
					<Button
						onClick={() => handleDownloadLabel(shipment.shipment_id)}
						className="w-full cursor-pointer"
					>
						Download Label
					</Button>
					<Button className="w-full">
						<Link href={`/track/${shipment.human_readable_shipment_id}`}>
							Track Shipment
						</Link>
					</Button>
				</div>
			)}
			<div className="grid grid-cols-1 gap-6 md:grid-cols-2">
				<Card>
					<CardHeader>
						<CardTitle>Shipment Details</CardTitle>
					</CardHeader>
					<CardContent className="grid gap-4">
						<div className="grid grid-cols-2 items-center gap-2">
							<p className="font-medium text-sm">Total Amount:</p>
							<p className="text-sm">
								₹{Number(shipment.shipping_cost).toFixed(2)}
							</p>
							<p className="font-medium text-sm">Shipment Status:</p>
							<Badge
								className={cn("w-fit text-blue-950", {
									"bg-green-200": shipment.shipment_status === "Approved",
									"bg-yellow-200":
										shipment.shipment_status === "PendingApproval",
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
							<p className="font-medium text-sm">Insurance:</p>
							<p className="text-sm">
								<Badge>{shipment.is_insurance_selected ? "Yes" : "No"}</Badge>
							</p>
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardHeader>
						<CardTitle>Origin Address</CardTitle>
					</CardHeader>
					<CardContent className="grid gap-4">
						<div className="grid grid-cols-2 items-center gap-2 text-sm">
							<p className="font-medium">Address Line:</p>
							<p>{shipment.origin_address.address_line}</p>
							{shipment.origin_address.landmark && (
								<>
									<p className="font-medium">Landmark:</p>
									<p>{shipment.origin_address.landmark}, </p>
								</>
							)}
							<p className="font-medium">City:</p>
							<p>{shipment.origin_address.city}</p>
							<p className="font-medium">State: </p>
							<p>{shipment.origin_address.state}</p>
							<p className="font-medium">Pincode:</p>
							<p>{shipment.origin_address.zip_code}</p>
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardHeader>
						<CardTitle>Destination Address</CardTitle>
					</CardHeader>
					<CardContent className="grid gap-4">
						<div className="grid grid-cols-2 items-center gap-2 text-sm">
							<p className="font-medium">Address Line:</p>
							<p>{shipment.destination_address.address_line}</p>
							{shipment.destination_address.landmark && (
								<>
									<p>Landmark:</p>
									<p>{shipment.destination_address.landmark}, </p>
								</>
							)}
							<p className="font-medium">City:</p>
							<p>{shipment.destination_address.city}</p>
							<p className="font-medium">State: </p>
							<p>{shipment.destination_address.state}</p>
							<p className="font-medium">Pincode:</p>
							<p>{shipment.destination_address.zip_code}</p>
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardHeader>
						<CardTitle>Recipient Details</CardTitle>
					</CardHeader>
					<CardContent className="grid gap-4">
						<div className="grid grid-cols-2 items-center gap-2">
							<p className="font-medium text-sm">Recipient:</p>
							<p className="text-sm">{shipment.recipient_name}</p>
							<p className="font-medium text-sm">Recipient Mobile:</p>
							<p className="text-sm">{shipment.recipient_mobile}</p>
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardHeader>
						<CardTitle>Package Details</CardTitle>
					</CardHeader>
					<CardContent className="grid gap-4">
						<div className="grid grid-cols-2 items-center gap-2">
							<p className="font-medium text-sm">Package Weight:</p>
							<p className="text-sm">
								{Number(shipment.package_weight).toFixed(2)} Kg
							</p>
							<p className="font-medium text-sm">Breadth:</p>
							<p className="text-sm">
								{shipment.package_dimensions.split(/\s*x\s*/i)[0]}
							</p>
							<p className="font-medium text-sm">Height:</p>
							<p className="text-sm">
								{shipment.package_dimensions.split(/\s*x\s*/i)[1]}
							</p>
							<p className="font-medium text-sm">Length:</p>
							<p className="text-sm">
								{shipment.package_dimensions.split(/\s*x\s*/i)[2]}
							</p>

							{shipment.package_image_url && (
								<>
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
								</>
							)}
							{shipment.invoiceUrl && (
								<>
									<p className="mb-2 font-medium text-sm">Invoice:</p>
									<Link
										href={shipment.invoiceUrl}
										target="_blank"
										rel="noopener noreferrer"
									>
										<img
											src={shipment.invoiceUrl}
											alt="Invoice"
											className="h-48 w-48 rounded-md object-cover"
										/>
									</Link>
								</>
							)}
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
