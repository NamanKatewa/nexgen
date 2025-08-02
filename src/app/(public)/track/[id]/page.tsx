"use client";

import { format } from "date-fns";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Badge } from "~/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Progress } from "~/components/ui/progress";
import { Separator } from "~/components/ui/separator";
import { cn } from "~/lib/utils";
import { api } from "~/trpc/react";

export default function TrackingPage() {
	const params = useParams();
	const id = params.id as string;

	const [progress, setProgress] = useState(0);

	// Show error immediately if no ID is provided
	if (!id || id.trim() === "") {
		return (
			<div className="flex min-h-screen items-center justify-center p-4">
				<Card className="w-full max-w-md">
					<CardHeader>
						<CardTitle className="text-center">Tracking</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-center text-red-500">
							Please provide a valid tracking ID
						</p>
					</CardContent>
				</Card>
			</div>
		);
	}

	const { data, isLoading, error, isFetching } =
		api.tracking.getTrackingData.useQuery(
			{ identifier: id },
			{
				enabled: true,
				refetchOnWindowFocus: false,
				refetchOnReconnect: false,
				refetchOnMount: false,
				staleTime: Number.POSITIVE_INFINITY,
				gcTime: Number.POSITIVE_INFINITY,
				suspense: false,
				networkMode: "offlineFirst",
				retry: 0,
			},
		);

	useEffect(() => {
		if (data?.shipment) {
			const status = data.shipment.current_status;
			switch (status) {
				case "SHIPMENT_BOOKED":
					setProgress(10);
					break;
				case "PICKED_UP":
					setProgress(30);
					break;
				case "IN_TRANSIT":
					setProgress(50);
					break;
				case "OUT_FOR_DELIVERY":
					setProgress(70);
					break;
				case "DELIVERED":
					setProgress(100);
					break;
				case "RTO":
				case "RTO_DELIVERED":
					setProgress(100);
					break;
				case null:
				case "CANCELLED":
					setProgress(0);
					break;
				default:
					setProgress(50);
					break;
			}
		}
	}, [data]);

	if (!id) {
		return (
			<div className="flex min-h-screen items-center justify-center p-4">
				<Card className="w-full max-w-md">
					<CardHeader>
						<CardTitle className="text-center">Tracking</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-center text-red-500">
							No tracking ID provided. Please use a URL like /track/YOUR_ID
						</p>
					</CardContent>
				</Card>
			</div>
		);
	}

	// Show loading state only during initial fetch
	if (isFetching && !data && !error) {
		return (
			<div className="flex min-h-screen items-center justify-center p-4">
				<Card className="w-full max-w-md">
					<CardHeader>
						<CardTitle className="text-center">Tracking</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="flex justify-center">
							<div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
						</div>
					</CardContent>
				</Card>
			</div>
		);
	}

	if (error) {
		return (
			<div className="flex min-h-screen items-center justify-center p-4">
				<Card className="w-full max-w-md">
					<CardContent>
						<p className="text-center text-red-500">{error.message}</p>
					</CardContent>
				</Card>
			</div>
		);
	}

	if (!data?.shipment) {
		return (
			<div className="flex min-h-screen items-center justify-center p-4">
				<Card className="w-full max-w-md">
					<CardHeader>
						<CardTitle className="text-center">Tracking</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-center text-orange-500">
							No shipment found for ID: {id}
						</p>
					</CardContent>
				</Card>
			</div>
		);
	}

	const { shipment, trackingEvents } = data;

	return (
		<div className="flex min-h-screen items-center justify-center p-4">
			<Card className="w-full max-w-2xl text-blue-950">
				<CardHeader>
					<CardTitle className="text-center">Shipment Tracking</CardTitle>
					<p className="text-center text-muted-foreground text-sm">
						ID: {shipment.human_readable_shipment_id} | AWB:{" "}
						{shipment.awb_number || "N/A"}
					</p>
				</CardHeader>
				<CardContent className="space-y-6">
					<div>
						<h3 className="mb-2 font-semibold text-lg">Current Status</h3>
						<Badge
							className={cn("w-fit text-md capitalize", {
								"bg-green-200 text-green-800":
									shipment.current_status === "DELIVERED" || "RTO_DELIVERED",
								"bg-yellow-200 text-yellow-800":
									shipment.current_status === "IN_TRANSIT" ||
									"OUT_FOR_DELIVERY" ||
									"SHIPMENT_BOOKED" ||
									"PICKED_UP" ||
									"ON_HOLD" ||
									"NETWORK_ISSUE" ||
									"DELIVERY_NEXT_DAY" ||
									"NOT_FOUND_INCORRECT" ||
									"OUT_OF_DELIVERY_AREA" ||
									"OTHERS" ||
									"DELIVERY_DELAYED" ||
									"DELIVERY_RESCHEDULED" ||
									"COD_PAYMENT_NOT_READY" ||
									"FUTURE_DELIVERY_REQUESTED" ||
									"ADDRESS_INCORRECT" ||
									"DELIVERY_ATTEMPTED" ||
									"PENDING_UNDELIVERED" ||
									"DELIVERY_ATTEMPTED_PREMISES_CLOSED" ||
									"OUT_FOR_PICKUP" ||
									"RETURN_IN_TRANSIT" ||
									"RETURN_OUT_FOR_PICKUP" ||
									"RETURN_SHIPMENT_PICKED_UP" ||
									"RETURN_PICKUP_RESCHEDULED" ||
									"RETURN_PICKUP_DELAYED" ||
									"RETURN_PICKUP_SCHEDULED" ||
									"RETURN_OUT_FOR_DELIVERY" ||
									"RETURN_UNDELIVERED" ||
									"REVERSE_PICKUP_EXCEPTION" ||
									"UNDELIVERED" ||
									"RTO" ||
									"CUSTOMER_REFUSED" ||
									"CONSIGNEE_UNAVAILABLE" ||
									"DELIVERY_EXCEPTION" ||
									"SHIPMENT_LOST" ||
									"PICKUP_FAILED" ||
									"RETURN_REQUEST_CANCELLED" ||
									"RETURN_REQUEST_CLOSED",
								"bg-red-200 text-red-800":
									shipment.current_status === "CANCELLED" || "PICKUP_CANCELLED",
							})}
						>
							{shipment.current_status?.replace(/_/g, " ").toLowerCase() ||
								"N/A"}
						</Badge>
						<Progress value={progress} className="mt-2 h-2" />
					</div>

					<Separator />

					<div>
						<h3 className="my-4 font-semibold text-lg">Shipment Details</h3>
						<div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
							<p>
								<strong>AWB:</strong> {shipment.awb_number}
							</p>
							<p>
								<strong>Courier:</strong> {shipment.courier?.name}
							</p>
							<p>
								<strong>Booked On:</strong>{" "}
								{format(new Date(shipment.created_at), "PPP p")}
							</p>
						</div>
					</div>

					<Separator />

					<div>
						<h3 className="my-4 font-semibold text-lg">Tracking History</h3>
						{trackingEvents.length > 0 ? (
							<div className="space-y-4">
								{trackingEvents.map((event) => (
									<div
										key={event.tracking_id}
										className="rounded-md border p-3 shadow-sm"
									>
										<p className="font-medium">{event.status_description}</p>
										<p className="text-muted-foreground text-sm">
											{format(new Date(event.timestamp), "PPP p")} -{" "}
											{event.location}
										</p>
									</div>
								))}
							</div>
						) : (
							<p className="text-muted-foreground">No tracking events yet.</p>
						)}
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
