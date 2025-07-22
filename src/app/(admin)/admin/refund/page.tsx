"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { FieldError } from "~/components/FieldError";
import { FormWrapper } from "~/components/FormWrapper";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Separator } from "~/components/ui/separator";
import { type RouterOutputs, api } from "~/trpc/react";

const formSchema = z.object({
	id: z.string().min(1, "ID cannot be empty"),
	refundAmount: z
		.number()
		.min(0, "Refund amount cannot be negative")
		.optional(),
});
type ShipmentDetails = RouterOutputs["refund"]["getShipmentDetails"];
const RefundPage = () => {
	const [shipmentDetails, setShipmentDetails] =
		useState<ShipmentDetails | null>(null);

	const {
		register,
		handleSubmit,
		formState: { errors },
		setValue,
		watch,
	} = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			id: "",
			refundAmount: 0,
		},
	});

	const id = watch("id");

	const getShipmentDetailsMutation = api.refund.getShipmentDetails.useMutation({
		onSuccess: (data: ShipmentDetails) => {
			setShipmentDetails(data);
			setValue("refundAmount", data.shipping_cost);
			toast.success("Shipment details fetched successfully.");
		},
		onError: (error: { message: string }) => {
			setShipmentDetails(null);
			setValue("refundAmount", 0);
			toast.error(error.message);
		},
	});

	const processRefundMutation = api.refund.processRefund.useMutation({
		onSuccess: (data: { message: string }) => {
			api.useUtils().shipment.getAllShipments.invalidate();
			api.useUtils().shipment.getAllTrackingShipments.invalidate();
			toast.success(data.message);
			setShipmentDetails(null);
			setValue("id", "");
			setValue("refundAmount", 0);
		},
		onError: (error: { message: string }) => {
			toast.error(error.message);
		},
	});

	const onFetchShipment = (values: z.infer<typeof formSchema>) => {
		getShipmentDetailsMutation.mutate({ id: values.id });
	};

	const onProcessRefund = () => {
		if (shipmentDetails && watch("refundAmount") !== undefined) {
			processRefundMutation.mutate({
				shipmentId: shipmentDetails.shipment_id,
				refundAmount: watch("refundAmount") ?? 0,
			});
		}
	};

	return (
		<div className="flex h-screen w-full items-center justify-center">
			<FormWrapper title="Process Refund" cardClassName="w-full max-w-md">
				<form onSubmit={handleSubmit(onFetchShipment)} className="space-y-6">
					<div className="space-y-2">
						<Label htmlFor="id">Shipment ID / Human-Readable ID</Label>
						<Input
							id="id"
							placeholder="Enter Shipment ID"
							{...register("id")}
							disabled={getShipmentDetailsMutation.isPending}
						/>
						<FieldError message={errors.id?.message} />
					</div>
					<Button
						type="submit"
						className="w-full"
						disabled={getShipmentDetailsMutation.isPending}
					>
						{getShipmentDetailsMutation.isPending
							? "Fetching..."
							: "Fetch Shipment Details"}
					</Button>
				</form>

				{shipmentDetails && (
					<div className="mt-6 space-y-4">
						<Separator />
						<Card>
							<CardHeader>
								<CardTitle>Shipment Details</CardTitle>
							</CardHeader>
							<CardContent className="space-y-2">
								<p>
									<strong>Amount:</strong> {shipmentDetails.shipping_cost}
								</p>
								<p>
									<strong>Origin:</strong>{" "}
									{shipmentDetails.origin_address.address_line},{" "}
									{shipmentDetails.origin_address.landmark && (
										<>{shipmentDetails.origin_address.landmark}, </>
									)}
									{shipmentDetails.origin_address.city},{" "}
									{shipmentDetails.origin_address.state} -{" "}
									{shipmentDetails.origin_address.zip_code}
								</p>
								<p>
									<strong>Destination:</strong>{" "}
									{shipmentDetails.destination_address.address_line},{" "}
									{shipmentDetails.destination_address.landmark && (
										<>{shipmentDetails.destination_address.landmark}, </>
									)}
									{shipmentDetails.destination_address.city},{" "}
									{shipmentDetails.destination_address.state} -{" "}
									{shipmentDetails.destination_address.zip_code}
								</p>
							</CardContent>
						</Card>

						<div className="space-y-2">
							<Label htmlFor="refundAmount">Refund Amount</Label>
							<Input
								id="refundAmount"
								type="number"
								step="0.01"
								{...register("refundAmount", { valueAsNumber: true })}
								disabled={processRefundMutation.isPending}
							/>
							<FieldError message={errors.refundAmount?.message} />
						</div>

						<Button
							onClick={onProcessRefund}
							className="w-full"
							disabled={processRefundMutation.isPending}
						>
							{processRefundMutation.isPending
								? "Processing..."
								: "Process Refund"}
						</Button>
					</div>
				)}
			</FormWrapper>
		</div>
	);
};

export default RefundPage;
