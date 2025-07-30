"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import Copyable from "~/components/Copyable";

import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Skeleton } from "~/components/ui/skeleton";
import { generateAndDownloadLabel } from "~/lib/pdf-generator";
import { cn } from "~/lib/utils";
import { formatDate } from "~/lib/utils";
import { api } from "~/trpc/react";

export default function AdminOrderDetailPage() {
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
							<CardTitle>Client Details</CardTitle>
						</CardHeader>
						<CardContent className="grid gap-4">
							<div className="grid grid-cols-2 items-center gap-2">
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
								<Skeleton className="h-8 w-full" />{" "}
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
		return (
			<div className="flex h-screen w-full items-center justify-center p-8">
				<p className="p-8 text-2xl text-red-500">Error: {error.message}</p>
			</div>
		);
	}

	if (!shipment) {
		return (
			<div className="flex h-screen w-full items-center justify-center p-8">
				<p className="text-2xl">Shipment Not Found for ID: {shipmentId}</p>
			</div>
		);
	}

	return (
		<div className="p-8">
			<h1 className="mb-6 font-bold text-3xl">
				Shipment Details - {shipment.human_readable_shipment_id}
			</h1>

			{shipment.awb_number && shipment.shipment_status === "Approved" && (
				<div className="flex flex-col gap-2 py-4">
					<Button
						onClick={() => handleDownloadLabel(shipment.shipment_id)}
						className="w-full"
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
							<p className="font-medium text-sm">Approval Status:</p>
							<Badge
								className={cn("w-fit text-blue-950", {
									"bg-green-200": shipment.shipment_status === "Approved",
									"bg-yellow-200":
										shipment.shipment_status === "PendingApproval",
									"bg-red-200": shipment.shipment_status === "Rejected",
									"bg-orange-200": shipment.shipment_status === "Hold",
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
						<CardTitle>Client Details</CardTitle>
					</CardHeader>
					<CardContent className="grid gap-4">
						<div className="grid grid-cols-2 items-center gap-2">
							<p className="font-medium text-sm">Name:</p>
							<Link href={`/admin/user/${shipment.user_id}`}>
								<p className="text-sm">{shipment.user.name}</p>
							</Link>
							<p className="font-medium text-sm">Email:</p>
							<Copyable content={shipment.user.email} />
							<p className="font-medium text-sm">Company:</p>
							<p className="text-sm">{shipment.user.kyc?.entity_name}</p>
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
							<p className="font-medium text-sm">Package Dimensions:</p>
							<div className="text-sm">
								<p>
									Breadth: {shipment.package_dimensions.split(/\s*x\s*/i)[0]} cm
								</p>
								<p>
									Height: {shipment.package_dimensions.split(/\s*x\s*/i)[1]} cm
								</p>
								<p>
									Length: {shipment.package_dimensions.split(/\s*x\s*/i)[2]} cm
								</p>
							</div>

							{shipment.package_image_url && (
								<>
									<p className="mb-2 font-medium text-sm">Package Image:</p>
									<Link
										href={shipment.package_image_url}
										target="_blank"
										rel="noopener noreferrer"
										className="h-48 w-48 rounded-sm border-2 border-blue-100"
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
										className="h-48 w-48 rounded-sm border-2 border-blue-100"
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
