"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { FieldError } from "~/components/FieldError";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { fileToBase64 } from "~/lib/file-utils";
import type { TFileSchema } from "~/schemas/file";
import {
	type TBulkShipmentsSchema,
	type TExcelShipmentSchema,
	bulkShipmentsSchema,
	excelShipmentSchema,
} from "~/schemas/shipment";
import { api } from "~/trpc/react";

type ShipmentWithStatus = TExcelShipmentSchema & {
	status?: "success" | "pending" | "error";
	message?: string;
	invoicePreview?: string | null;
};

type ShipmentResult = {
	recipientName: string;
	status: "success" | "pending" | "error";
	message: string;
	shipmentId?: string;
};

export default function CreateBulkShipmentPage() {
	const router = useRouter();

	const [isLoading, setIsLoading] = useState(false);
	const [shipments, setShipments] = useState<ShipmentWithStatus[]>([]);
	const [shipmentResults, setShipmentResults] = useState<ShipmentResult[]>([]);
	const [calculatedRates, setCalculatedRates] = useState<
		({ rate: number | null; insurancePremium: number } | null)[]
	>([]);
	const [totalCalculatedRate, setTotalCalculatedRate] = useState<number | null>(
		null,
	);
	const [totalInsurancePremium, setTotalInsurancePremium] = useState<
		number | null
	>(null);
	const [isSubmitted, setIsSubmitted] = useState(false);

	const {
		data: bulkRatesData,
		error: bulkRatesError,
		isFetching: isCalculatingBulkRates,
		refetch: refetchBulkRates,
	} = api.rate.calculateBulkRates.useQuery(
		shipments.map((s) => ({
			originZipCode: s.originZipCode,
			destinationZipCode: s.destinationZipCode,
			packageWeight: s.packageWeight,
			isInsuranceSelected: s.isInsuranceSelected,
		})),
		{
			enabled: false, // Only fetch on demand
			refetchOnWindowFocus: false,
		},
	);

	const {
		handleSubmit,
		formState: { errors },
		setValue,
		trigger,
		clearErrors,
	} = useForm<TBulkShipmentsSchema>({
		resolver: zodResolver(bulkShipmentsSchema),
		defaultValues: {
			shipments: [],
		},
	});

	useEffect(() => {
		if (bulkRatesData) {
			setShipments((prevShipments) => {
				return prevShipments.map((shipment, index) => ({
					...shipment,
					calculatedRate: bulkRatesData[index]?.rate ?? null,
				}));
			});
			setCalculatedRates(bulkRatesData);
			setTotalCalculatedRate(
				bulkRatesData.reduce(
					(sum: number, result) => sum + (result?.rate ?? 0),
					0,
				),
			);
			setTotalInsurancePremium(
				bulkRatesData.reduce(
					(sum: number, result) => sum + (result?.insurancePremium ?? 0),
					0,
				),
			);
		}
	}, [bulkRatesData]);

	useEffect(() => {
		if (bulkRatesError) {
			toast.error(bulkRatesError.message);
			setCalculatedRates([]);
			setTotalCalculatedRate(null);
		}
	}, [bulkRatesError]);

	const handleCalculateRates = useCallback(async () => {
		clearErrors();
		const isValid = await trigger("shipments");
		if (!isValid) {
			toast.error("Please correct the errors in the shipment details.");
			return;
		}
		const canCalculate = shipments.every(
			(s) => s.originZipCode && s.destinationZipCode && s.packageWeight > 0,
		);
		if (!canCalculate) {
			toast.error(
				"Please ensure all shipments have valid origin/destination zip codes and package weights.",
			);
			return;
		}
		try {
			await refetchBulkRates();
		} catch (error) {
			console.error("Error calculating bulk rates:", error);
			toast.error("Failed to calculate rates. Please try again.");
		}
	}, [shipments, refetchBulkRates, trigger, clearErrors]);

	const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (file) {
			const reader = new FileReader();
			reader.onload = (e) => {
				const data = e.target?.result;
				const workbook = XLSX.read(data, { type: "array" });
				if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
					toast.error("The uploaded Excel file does not contain any sheets.");
					return;
				}
				const sheetName = workbook.SheetNames[0];
				if (!sheetName) {
					toast.error(
						"The first sheet name could not be read from the Excel file.",
					);
					return;
				}
				const worksheet = workbook.Sheets[sheetName];
				if (!worksheet) {
					toast.error("Could not find the specified sheet in the Excel file.");
					return;
				}
				const json = XLSX.utils.sheet_to_json(worksheet) as Record<
					string,
					unknown
				>[];

				const parsedShipments: ShipmentWithStatus[] = json
					.filter(
						(r): r is Record<string, unknown> => r !== undefined && r !== null,
					)
					.map((row: Record<string, unknown>) => ({
						recipientName: String(row["Recipient Name"]) || "",
						recipientMobile: String(row["Recipient Mobile Number"] || ""),
						packageWeight: Number(row["Package Weight (kg)"]) || 0,
						packageHeight: Number(row["Package Height (cm)"]) || 0,
						packageLength: Number(row["Package Length (cm)"]) || 0,
						packageBreadth: Number(row["Package Breadth (cm)"]) || 0,
						originAddressLine: String(row["Origin Address Line"]) || "",
						originZipCode: String(row["Origin Zip Code"] || ""),
						originCity: String(row["Origin City"]) || "",
						originState: String(row["Origin State"]) || "",
						destinationAddressLine:
							String(row["Destination Address Line"]) || "",
						destinationZipCode: String(row["Destination Zip Code"] || ""),
						destinationCity: String(row["Destination City"]) || "",
						destinationState: String(row["Destination State"]) || "",
						packageImage: { data: "", name: "", type: "", size: 0 },
						declaredValue: Number(row["Declared Value"]) || 0,
						isInsuranceSelected:
							String(row.Insurance ?? "")
								.trim()
								.toLowerCase() === "yes",
						status: undefined,
						message: undefined,
					}));

				setShipments(parsedShipments);
				setValue("shipments", parsedShipments);
				setCalculatedRates([]);
				setTotalCalculatedRate(null);
				setShipmentResults([]);
				setIsSubmitted(false); // Reset submission status on new file upload
				trigger("shipments");
			};
			reader.readAsArrayBuffer(file);
		}
	};

	const handleImageFileChange = async (
		event: React.ChangeEvent<HTMLInputElement>,
		index: number,
	) => {
		const file = event.target.files?.[0];
		if (file) {
			try {
				const base64Data = await fileToBase64(file);
				const newShipments = [...shipments];
				if (newShipments[index]) {
					newShipments[index].packageImage = {
						data: base64Data,
						name: file.name,
						type: file.type,
						size: file.size,
					};
				}
				setShipments(newShipments);
				setValue(`shipments.${index}.packageImage`, {
					data: base64Data,
					name: file.name,
					type: file.type,
					size: file.size,
				});
				trigger(`shipments.${index}.packageImage`);
			} catch (error) {
				console.error("Error converting file to Base64:", error);
				toast.error(`Failed to process image file for shipment ${index + 1}`);
			}
		}
	};

	const handleInvoiceFileChange = async (
		event: React.ChangeEvent<HTMLInputElement>,
		index: number,
	) => {
		const file = event.target.files?.[0];
		if (file) {
			try {
				const base64Data = await fileToBase64(file);
				const newShipments = [...shipments];
				if (newShipments[index]) {
					newShipments[index].invoice = {
						data: base64Data,
						name: file.name,
						type: file.type,
						size: file.size,
					};
					newShipments[index].invoicePreview = URL.createObjectURL(file);
				}
				setShipments(newShipments);
				setValue(`shipments.${index}.invoice`, {
					data: base64Data,
					name: file.name,
					type: file.type,
					size: file.size,
				});
				trigger(`shipments.${index}.invoice`);
			} catch (error) {
				console.error("Error converting file to Base64:", error);
				toast.error(`Failed to process invoice file for shipment ${index + 1}`);
			}
		} else {
			const newShipments = [...shipments];
			if (newShipments[index]) {
				newShipments[index].invoice = undefined;
				newShipments[index].invoicePreview = undefined;
			}
			setShipments(newShipments);
			setValue(`shipments.${index}.invoice`, undefined);
			trigger(`shipments.${index}.invoice`);
		}
	};

	const createBulkShipmentMutation =
		api.shipment.createBulkShipments.useMutation({
			onSuccess: (data) => {
				setIsLoading(false);
				setShipmentResults(data);
				setIsSubmitted(true); // Set isSubmitted to true on success

				const updatedShipments = shipments.map((s) => {
					const result = data.find((r) => r.recipientName === s.recipientName);
					return result ? { ...s, ...result } : s;
				});
				setShipments(updatedShipments);

				const successCount = data.filter((r) => r.status === "success").length;
				const pendingCount = data.filter((r) => r.status === "pending").length;
				const errorCount = data.filter((r) => r.status === "error").length;

				toast.info(
					`Processing complete: ${successCount} created, ${pendingCount} pending, ${errorCount} failed.`,
				);
			},
			onError: (err) => {
				toast.error(err.message);
				setIsLoading(false);
			},
		});

	const onSubmit = async (data: TBulkShipmentsSchema) => {
		setIsLoading(true);
		clearErrors();
		setShipmentResults([]);

		const isValid = await trigger("shipments");
		if (!isValid) {
			toast.error(
				"Please correct the errors in the shipment details before submitting.",
			);
			setIsLoading(false);
			return;
		}

		createBulkShipmentMutation.mutate({ shipments: data.shipments });
	};

	return (
		<div className="flex min-h-screen items-center justify-center p-4">
			<Card className="w-full bg-blue-100/20">
				<CardHeader>
					<h1 className="text-center font-semibold text-2xl text-blue-950">
						Create Bulk Shipments
					</h1>
					<p className="text-center text-blue-900 text-sm">
						Upload an Excel file to create multiple shipments.
					</p>
				</CardHeader>
				<CardContent>
					<form
						onSubmit={handleSubmit(onSubmit)}
						className="space-y-4 text-blue-950"
					>
						<Card className="mb-6 p-4">
							<CardHeader className="p-0 pb-4">
								<h2 className="font-semibold text-lg">Upload Shipment Data</h2>
							</CardHeader>
							<CardContent className="space-y-4 p-0">
								<div className="space-y-2">
									<Label htmlFor="excelFile">Select Excel File</Label>
									<Input
										id="excelFile"
										type="file"
										accept=".xlsx, .xls"
										onChange={handleFileUpload}
										disabled={isLoading}
									/>
									<p className="text-gray-500 text-sm">
										Download sample template:{" "}
										<a
											href="/templates/sample_bulk_shipments.xlsx"
											download
											className="text-blue-600 hover:underline"
										>
											sample_bulk_shipments.xlsx
										</a>
									</p>
								</div>
							</CardContent>
						</Card>

						{shipments.length > 0 && (
							<div className="mt-8">
								<h2 className="mb-4 font-bold text-xl">
									Shipments to be Processed
								</h2>
								<div className="overflow-x-auto">
									<table
										className="divide-y divide-gray-200"
										style={{ width: "max-content", minWidth: "100%" }}
									>
										<thead className="bg-gray-50">
											<tr>
												<th className="w-[60px] px-3 py-3 text-left font-medium text-gray-500 text-xs uppercase tracking-wider">
													#
												</th>
												<th className="min-w-[150px] px-3 py-3 text-left font-medium text-gray-500 text-xs uppercase tracking-wider">
													Recipient Name
												</th>
												<th className="min-w-[130px] px-3 py-3 text-left font-medium text-gray-500 text-xs uppercase tracking-wider">
													Recipient Mobile
												</th>
												<th className="min-w-[100px] px-3 py-3 text-left font-medium text-gray-500 text-xs uppercase tracking-wider">
													Weight (kg)
												</th>
												<th className="min-w-[100px] px-3 py-3 text-left font-medium text-gray-500 text-xs uppercase tracking-wider">
													Height (cm)
												</th>
												<th className="min-w-[100px] px-3 py-3 text-left font-medium text-gray-500 text-xs uppercase tracking-wider">
													Length (cm)
												</th>
												<th className="min-w-[100px] px-3 py-3 text-left font-medium text-gray-500 text-xs uppercase tracking-wider">
													Breadth (cm)
												</th>
												<th className="min-w-[250px] px-3 py-3 text-left font-medium text-gray-500 text-xs uppercase tracking-wider">
													Origin Address
												</th>
												<th className="min-w-[250px] px-3 py-3 text-left font-medium text-gray-500 text-xs uppercase tracking-wider">
													Destination Address
												</th>
												<th className="min-w-[100px] px-3 py-3 text-left font-medium text-gray-500 text-xs uppercase tracking-wider">
													Declared Value
												</th>
												<th className="min-w-[100px] px-3 py-3 text-left font-medium text-gray-500 text-xs uppercase tracking-wider">
													Insurance
												</th>
												<th className="min-w-[180px] px-3 py-3 text-left font-medium text-gray-500 text-xs uppercase tracking-wider">
													Package Image
												</th>
												<th className="min-w-[180px] px-3 py-3 text-left font-medium text-gray-500 text-xs uppercase tracking-wider">
													Invoice
												</th>
												{isSubmitted && (
													<th className="min-w-[150px] px-3 py-3 text-left font-medium text-gray-500 text-xs uppercase tracking-wider">
														Status
													</th>
												)}
												{!isSubmitted && (
													<th className="min-w-[120px] px-3 py-3 text-left font-medium text-gray-500 text-xs uppercase tracking-wider">
														Calculated Rate
													</th>
												)}
												{!isSubmitted && (
													<th className="min-w-[120px] px-3 py-3 text-left font-medium text-gray-500 text-xs uppercase tracking-wider">
														Insurance Premium
													</th>
												)}
											</tr>
										</thead>
										<tbody className="divide-y divide-gray-200 bg-white">
											{shipments.map((shipment, index) => (
												<tr
													key={`${shipment.recipientName}-${index}`}
													className="align-top"
												>
													<td
														className="px-3 py-2 text-center align-top text-gray-500 text-sm"
														style={{ width: "60px" }}
													>
														{index + 1}
													</td>
													<td className="min-w-[150px] px-3 py-2 align-top text-gray-500 text-sm">
														<Input
															value={shipment.recipientName}
															onChange={(e) => {
																const newValue = e.target.value;
																const newShipments = [...shipments];
																if (newShipments[index]) {
																	newShipments[index].recipientName = newValue;
																	setShipments(newShipments);
																	setValue(
																		`shipments.${index}.recipientName`,
																		newValue,
																	);
																	trigger(`shipments.${index}.recipientName`);
																}
															}}
															className={`w-full ${errors.shipments?.[index]?.recipientName?.message ? "border-red-500" : ""}`}
														/>
														<FieldError
															message={
																errors.shipments?.[index]?.recipientName
																	?.message
															}
														/>
													</td>
													<td className="min-w-[130px] px-3 py-2 align-top text-gray-500 text-sm">
														<Input
															value={shipment.recipientMobile}
															onChange={(e) => {
																const newValue = e.target.value;
																const newShipments = [...shipments];
																if (newShipments[index]) {
																	newShipments[index].recipientMobile =
																		newValue;
																	setShipments(newShipments);
																	setValue(
																		`shipments.${index}.recipientMobile`,
																		newValue,
																	);
																	trigger(`shipments.${index}.recipientMobile`);
																}
															}}
															className={`w-full ${errors.shipments?.[index]?.recipientMobile?.message ? "border-red-500" : ""}`}
														/>
														<FieldError
															message={
																errors.shipments?.[index]?.recipientMobile
																	?.message
															}
														/>
													</td>
													<td className="min-w-[100px] px-3 py-2 align-top text-gray-500 text-sm">
														<Input
															type="number"
															step="any"
															value={shipment.packageWeight}
															onChange={(e) => {
																const newValue = Number(e.target.value);
																const newShipments = [...shipments];
																if (newShipments[index]) {
																	newShipments[index].packageWeight = newValue;
																	setShipments(newShipments);
																	setValue(
																		`shipments.${index}.packageWeight`,
																		newValue,
																	);
																	trigger(`shipments.${index}.packageWeight`);
																}
															}}
															className={`w-full ${errors.shipments?.[index]?.packageWeight?.message ? "border-red-500" : ""}`}
														/>
														<FieldError
															message={
																errors.shipments?.[index]?.packageWeight
																	?.message
															}
														/>
													</td>
													<td className="min-w-[100px] px-3 py-2 align-top text-gray-500 text-sm">
														<Input
															type="number"
															step="any"
															value={shipment.packageHeight}
															onChange={(e) => {
																const newValue = Number(e.target.value);
																const newShipments = [...shipments];
																if (newShipments[index]) {
																	newShipments[index].packageHeight = newValue;
																	setShipments(newShipments);
																	setValue(
																		`shipments.${index}.packageHeight`,
																		newValue,
																	);
																	trigger(`shipments.${index}.packageHeight`);
																}
															}}
															className={`w-full ${errors.shipments?.[index]?.packageHeight?.message ? "border-red-500" : ""}`}
														/>
														<FieldError
															message={
																errors.shipments?.[index]?.packageHeight
																	?.message
															}
														/>
													</td>
													<td className="min-w-[100px] px-3 py-2 align-top text-gray-500 text-sm">
														<Input
															type="number"
															step="any"
															value={shipment.packageLength}
															onChange={(e) => {
																const newValue = Number(e.target.value);
																const newShipments = [...shipments];
																if (newShipments[index]) {
																	newShipments[index].packageLength = newValue;
																	setShipments(newShipments);
																	setValue(
																		`shipments.${index}.packageLength`,
																		newValue,
																	);
																	trigger(`shipments.${index}.packageLength`);
																}
															}}
															className={`w-full ${errors.shipments?.[index]?.packageLength?.message ? "border-red-500" : ""}`}
														/>
														<FieldError
															message={
																errors.shipments?.[index]?.packageLength
																	?.message
															}
														/>
													</td>
													<td className="min-w-[100px] px-3 py-2 align-top text-gray-500 text-sm">
														<Input
															type="number"
															step="any"
															value={shipment.packageBreadth}
															onChange={(e) => {
																const newValue = Number(e.target.value);
																const newShipments = [...shipments];
																if (newShipments[index]) {
																	newShipments[index].packageBreadth = newValue;
																	setShipments(newShipments);
																	setValue(
																		`shipments.${index}.packageBreadth`,
																		newValue,
																	);
																	trigger(`shipments.${index}.packageBreadth`);
																}
															}}
															className={`w-full ${errors.shipments?.[index]?.packageBreadth?.message ? "border-red-500" : ""}`}
														/>
														<FieldError
															message={
																errors.shipments?.[index]?.packageBreadth
																	?.message
															}
														/>
													</td>
													<td
														className="px-3 py-2 align-top text-gray-500 text-sm"
														style={{ width: "250px" }}
													>
														<Input
															value={shipment.originAddressLine}
															onChange={(e) => {
																const newValue = e.target.value;
																const newShipments = [...shipments];
																if (newShipments[index]) {
																	newShipments[index].originAddressLine =
																		newValue;
																	setShipments(newShipments);
																	setValue(
																		`shipments.${index}.originAddressLine`,
																		newValue,
																	);
																	trigger(
																		`shipments.${index}.originAddressLine`,
																	);
																}
															}}
															className={`w-full ${
																errors.shipments?.[index]?.originAddressLine
																	?.message
																	? "border-red-500"
																	: ""
															}`}
														/>
														<Input
															value={shipment.originCity}
															onChange={(e) => {
																const newValue = e.target.value;
																const newShipments = [...shipments];
																if (newShipments[index]) {
																	newShipments[index].originCity = newValue;
																	setShipments(newShipments);
																	setValue(
																		`shipments.${index}.originCity`,
																		newValue,
																	);
																	trigger(`shipments.${index}.originCity`);
																}
															}}
															className={`w-full ${
																errors.shipments?.[index]?.originCity?.message
																	? "border-red-500"
																	: ""
															}`}
														/>
														<Input
															value={shipment.originState}
															onChange={(e) => {
																const newValue = e.target.value;
																const newShipments = [...shipments];
																if (newShipments[index]) {
																	newShipments[index].originState = newValue;
																	setShipments(newShipments);
																	setValue(
																		`shipments.${index}.originState`,
																		newValue,
																	);
																	trigger(`shipments.${index}.originState`);
																}
															}}
															className={`w-full ${
																errors.shipments?.[index]?.originState?.message
																	? "border-red-500"
																	: ""
															}`}
														/>
														<Input
															value={shipment.originZipCode}
															onChange={(e) => {
																const newValue = e.target.value;
																const newShipments = [...shipments];
																if (newShipments[index]) {
																	newShipments[index].originZipCode = newValue;
																	setShipments(newShipments);
																	setValue(
																		`shipments.${index}.originZipCode`,
																		newValue,
																	);
																	trigger(`shipments.${index}.originZipCode`);
																}
															}}
															className={`w-full ${
																errors.shipments?.[index]?.originZipCode
																	?.message
																	? "border-red-500"
																	: ""
															}`}
														/>
														<FieldError
															message={
																errors.shipments?.[index]?.originAddressLine
																	?.message
															}
														/>
													</td>
													<td
														className="px-3 py-2 align-top text-gray-500 text-sm"
														style={{ width: "250px" }}
													>
														<Input
															value={shipment.destinationAddressLine}
															onChange={(e) => {
																const newValue = e.target.value;
																const newShipments = [...shipments];
																if (newShipments[index]) {
																	newShipments[index].destinationAddressLine =
																		newValue;
																	setShipments(newShipments);
																	setValue(
																		`shipments.${index}.destinationAddressLine`,
																		newValue,
																	);
																	trigger(
																		`shipments.${index}.destinationAddressLine`,
																	);
																}
															}}
															className={`w-full ${
																errors.shipments?.[index]
																	?.destinationAddressLine?.message
																	? "border-red-500"
																	: ""
															}`}
														/>
														<Input
															value={shipment.destinationCity}
															onChange={(e) => {
																const newValue = e.target.value;
																const newShipments = [...shipments];
																if (newShipments[index]) {
																	newShipments[index].destinationCity =
																		newValue;
																	setShipments(newShipments);
																	setValue(
																		`shipments.${index}.destinationCity`,
																		newValue,
																	);
																	trigger(`shipments.${index}.destinationCity`);
																}
															}}
															className={`w-full ${
																errors.shipments?.[index]?.destinationCity
																	?.message
																	? "border-red-500"
																	: ""
															}`}
														/>
														<Input
															value={shipment.destinationState}
															onChange={(e) => {
																const newValue = e.target.value;
																const newShipments = [...shipments];
																if (newShipments[index]) {
																	newShipments[index].destinationState =
																		newValue;
																	setShipments(newShipments);
																	setValue(
																		`shipments.${index}.destinationState`,
																		newValue,
																	);
																	trigger(
																		`shipments.${index}.destinationState`,
																	);
																}
															}}
															className={`w-full ${
																errors.shipments?.[index]?.destinationState
																	?.message
																	? "border-red-500"
																	: ""
															}`}
														/>
														<Input
															value={shipment.destinationZipCode}
															onChange={(e) => {
																const newValue = e.target.value;
																const newShipments = [...shipments];
																if (newShipments[index]) {
																	newShipments[index].destinationZipCode =
																		newValue;
																	setShipments(newShipments);
																	setValue(
																		`shipments.${index}.destinationZipCode`,
																		newValue,
																	);
																	trigger(
																		`shipments.${index}.destinationZipCode`,
																	);
																}
															}}
															className={`w-full ${
																errors.shipments?.[index]?.destinationZipCode
																	?.message
																	? "border-red-500"
																	: ""
															}`}
														/>
														<FieldError
															message={
																errors.shipments?.[index]
																	?.destinationAddressLine?.message
															}
														/>
													</td>
													<td
														className="px-3 py-2 align-top text-gray-500 text-sm"
														style={{ minWidth: "100px" }}
													>
														<Input
															type="number"
															step="any"
															value={shipment.declaredValue}
															onChange={(e) => {
																const newValue = Number(e.target.value);
																const newShipments = [...shipments];
																if (newShipments[index]) {
																	newShipments[index].declaredValue = newValue;
																	setShipments(newShipments);
																	setValue(
																		`shipments.${index}.declaredValue`,
																		newValue,
																	);
																	trigger(`shipments.${index}.declaredValue`);
																}
															}}
															className={`w-full ${
																errors.shipments?.[index]?.declaredValue
																	?.message
																	? "border-red-500"
																	: ""
															}`}
														/>
														<FieldError
															message={
																errors.shipments?.[index]?.declaredValue
																	?.message
															}
														/>
													</td>
													<td
														className="px-3 py-2 align-top text-gray-500 text-sm"
														style={{ minWidth: "100px" }}
													>
														<Input
															type="checkbox"
															checked={shipment.isInsuranceSelected}
															onChange={(e) => {
																const newValue = e.target.checked;
																const newShipments = [...shipments];
																if (newShipments[index]) {
																	newShipments[index].isInsuranceSelected =
																		newValue;
																	setShipments(newShipments);
																	setValue(
																		`shipments.${index}.isInsuranceSelected`,
																		newValue,
																	);
																	trigger(
																		`shipments.${index}.isInsuranceSelected`,
																	);
																}
															}}
															className={`w-full ${
																errors.shipments?.[index]?.isInsuranceSelected
																	?.message
																	? "border-red-500"
																	: ""
															}`}
														/>
														<FieldError
															message={
																errors.shipments?.[index]?.isInsuranceSelected
																	?.message
															}
														/>
													</td>
													<td
														className="px-3 py-2 align-top text-gray-500 text-sm"
														style={{ minWidth: "180px" }}
													>
														<Input
															type="file"
															accept="image/*"
															onChange={(e) => handleImageFileChange(e, index)}
															className="mb-2 w-full"
														/>
														<div className="relative flex h-16 w-16 items-center justify-center rounded border bg-gray-100">
															{shipment.packageImage?.data ? (
																<Image
																	src={shipment.packageImage.data}
																	alt="Package Preview"
																	className="h-full w-full object-cover"
																	width={64}
																	height={64}
																/>
															) : (
																<span className="text-center text-gray-400 text-xs">
																	No Image
																</span>
															)}
														</div>
														<FieldError
															message={
																errors.shipments?.[index]?.packageImage
																	?.message as string
															}
														/>
													</td>

													<td
														className="px-3 py-2 align-top text-gray-500 text-sm"
														style={{ minWidth: "180px" }}
													>
														{shipment.isInsuranceSelected && (
															<>
																<Input
																	type="file"
																	accept="application/pdf,image/*"
																	onChange={(e) =>
																		handleInvoiceFileChange(e, index)
																	}
																	className="mb-2 w-full"
																/>
																{shipment.invoicePreview && (
																	<p className="text-muted-foreground text-sm">
																		File selected:{" "}
																		{shipment.invoicePreview.split("/").pop()}
																	</p>
																)}
																<FieldError
																	message={
																		errors.shipments?.[index]?.invoice
																			?.message as string
																	}
																/>
															</>
														)}
													</td>
													{isSubmitted && (
														<td
															className="px-3 py-2 align-top text-gray-500 text-sm"
															style={{ minWidth: "120px" }}
														>
															{shipment.status && (
																<div className="flex max-w-[150px] flex-col gap-1 whitespace-normal">
																	<Badge
																		variant={
																			shipment.status === "success"
																				? "default"
																				: shipment.status === "pending"
																					? "secondary"
																					: "destructive"
																		}
																		className={`capitalize ${
																			shipment.status === "success"
																				? "bg-green-200 text-white"
																				: shipment.status === "pending"
																					? "bg-yellow-200 text-black"
																					: "bg-red-200 text-white"
																		}`}
																	>
																		{shipment.status}
																	</Badge>
																	<p className="text-gray-500 text-xs">
																		{shipment.message}
																	</p>
																</div>
															)}
														</td>
													)}
													{!isSubmitted && (
														<td
															className="px-3 py-2 align-top text-gray-500 text-sm"
															style={{ minWidth: "120px" }}
														>
															{calculatedRates[index]
																? `₹${calculatedRates[index]?.rate?.toFixed(2)}`
																: "N/A"}
														</td>
													)}
													{!isSubmitted && (
														<td
															className="px-3 py-2 align-top text-gray-500 text-sm"
															style={{ minWidth: "120px" }}
														>
															{calculatedRates[index]
																? `₹${calculatedRates[index]?.insurancePremium?.toFixed(2)}`
																: "N/A"}
														</td>
													)}
												</tr>
											))}
										</tbody>
									</table>
								</div>
							</div>
						)}
						{shipments.length > 0 && !shipmentResults.length && (
							<Button
								type="button"
								onClick={handleCalculateRates}
								disabled={isCalculatingBulkRates || isLoading}
								className="w-full"
							>
								{isCalculatingBulkRates ? "Calculating..." : "Calculate Rates"}
							</Button>
						)}

						<div
							className={`mt-4 text-right font-semibold text-xl ${totalCalculatedRate === null || shipmentResults.length > 0 ? "invisible h-0" : ""}`}
						>
							Total Estimated Rate: ₹{totalCalculatedRate?.toFixed(2)} + ₹
							{totalInsurancePremium?.toFixed(2)} (Insurance) = ₹
							{(totalCalculatedRate && totalInsurancePremium !== null
								? totalCalculatedRate + totalInsurancePremium
								: totalCalculatedRate
							)?.toFixed(2)}
						</div>

						<Button
							type="submit"
							className="w-full"
							disabled={
								isLoading ||
								shipments.length === 0 ||
								createBulkShipmentMutation.isPending ||
								totalCalculatedRate === null ||
								shipmentResults.length > 0
							}
						>
							{isLoading ? "Processing..." : "Create Bulk Shipments"}
						</Button>
					</form>
				</CardContent>
			</Card>
		</div>
	);
}
