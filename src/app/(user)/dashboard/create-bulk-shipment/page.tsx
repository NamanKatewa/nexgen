"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ADDRESS_TYPE } from "@prisma/client";
import { PlusCircle } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import type { Path } from "react-hook-form";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { FieldError } from "~/components/FieldError";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { fileToBase64 } from "~/lib/file-utils";
import {
	type TExcelOrderSchema,
	type TExcelShipmentSchema,
	excelOrderSchema,
	submitShipmentSchema,
} from "~/schemas/order";
import { api } from "~/trpc/react";

export default function CreateBulkShipmentPage() {
	const router = useRouter();

	const [isLoading, setIsLoading] = useState(false);
	const [shipments, setShipments] = useState<TExcelShipmentSchema[]>([]);
	const [calculatedRates, setCalculatedRates] = useState<(number | null)[]>([]);
	const [totalCalculatedRate, setTotalCalculatedRate] = useState<number | null>(
		null,
	);

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
		getValues,
		trigger,
		setError,
		clearErrors,
	} = useForm<TExcelOrderSchema>({
		resolver: zodResolver(excelOrderSchema),
		defaultValues: {
			shipments: [],
		},
	});

	const createManyOrGetExistingAddressesMutation =
		api.address.createManyOrGetExisting.useMutation();

	useEffect(() => {
		if (bulkRatesData) {
			setShipments((prevShipments) => {
				return prevShipments.map((shipment, index) => ({
					...shipment,
					calculatedRate: bulkRatesData[index] ?? null,
				}));
			});
			setCalculatedRates(bulkRatesData);
			setTotalCalculatedRate(
				bulkRatesData.reduce((sum: number, rate) => sum + (rate ?? 0), 0),
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

		// Validate all shipments before calculating rates
		const isValid = await trigger("shipments");
		if (!isValid) {
			toast.error("Please correct the errors in the shipment details.");
			return;
		}

		// Check if all required fields for rate calculation are present
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
					setIsLoading(false);
					return;
				}
				const sheetName = workbook.SheetNames[0];
				if (!sheetName) {
					toast.error("Could not find the specified sheet in the Excel file.");
					setIsLoading(false);
					return;
				}
				const worksheet = workbook.Sheets[sheetName];
				if (!worksheet) {
					toast.error("Could not find the specified sheet in the Excel file.");
					setIsLoading(false);
					return;
				}
				const json = XLSX.utils.sheet_to_json(worksheet) as Record<
					string,
					unknown
				>[];

				const parsedShipments: TExcelShipmentSchema[] = json
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
					}));
				setShipments(parsedShipments);
				setValue(
					"shipments",
					parsedShipments.map((s) => ({
						...s,
						originAddressId: "",
						destinationAddressId: "",
						calculatedRate: null, // Reset calculated rate
					})),
				);
				setCalculatedRates([]); // Clear previous calculated rates
				setTotalCalculatedRate(null); // Clear total calculated rate
				trigger("shipments"); // Trigger validation for all shipments after parsing
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
				// Update the packageImage for the specific shipment in the local state
				if (newShipments[index]) {
					newShipments[index] = {
						...newShipments[index],
						packageImage: {
							data: base64Data,
							name: file.name,
							type: file.type,
							size: file.size,
						},
					};
				}
				setShipments(newShipments);
				// Also update the form state
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
				const newShipments = [...shipments];
				if (newShipments[index]) {
					newShipments[index] = {
						...newShipments[index],
						packageImage: { data: "", name: "", type: "", size: 0 },
					};
				}
				setShipments(newShipments);
				setValue(`shipments.${index}.packageImage`, {
					data: "",
					name: "",
					type: "",
					size: 0,
				});
			}
		} else {
			const newShipments = [...shipments];
			if (newShipments[index]) {
				newShipments[index] = {
					...newShipments[index],
					packageImage: { data: "", name: "", type: "", size: 0 },
				};
			}
			setShipments(newShipments);
			setValue(`shipments.${index}.packageImage`, {
				data: "",
				name: "",
				type: "",
				size: 0,
			});
			trigger(`shipments.${index}.packageImage`);
		}
	};

	const createBulkShipmentMutation = api.order.createBulkShipments.useMutation({
		onSuccess: (data) => {
			setIsLoading(false);
			toast.success("Bulk shipments created successfully! Redirecting...");
			setTimeout(() => {
				router.push("/dashboard");
				router.refresh();
			}, 2000);
			if (!data.success) {
				toast.error(
					data.message ?? "An error occurred while creating bulk shipments.",
				);
			}
		},
		onError: (err) => {
			toast.error(err.message);
			setIsLoading(false);
		},
	});

	const onSubmit = async (data: TExcelOrderSchema) => {
		setIsLoading(true);

		clearErrors(); // Clear all previous errors

		const originAddressesToCreate = data.shipments.map((shipment) => ({
			name: `Origin for ${shipment.recipientName}`,
			addressLine: shipment.originAddressLine ?? "",
			zipCode: Number(shipment.originZipCode ?? 0),
			city: shipment.originCity ?? "",
			state: shipment.originState ?? "",
			type: ADDRESS_TYPE.Warehouse,
		}));

		const destinationAddressesToCreate = data.shipments.map((shipment) => ({
			name: shipment.recipientName,
			addressLine: shipment.destinationAddressLine ?? "",
			zipCode: Number(shipment.destinationZipCode ?? 0),
			city: shipment.destinationCity ?? "",
			state: shipment.destinationState ?? "",
			type: ADDRESS_TYPE.User,
		}));

		const allAddressesToProcess = [
			...originAddressesToCreate,
			...destinationAddressesToCreate,
		];

		let originAddressIds: string[] = [];
		let destinationAddressIds: string[] = [];

		try {
			const allAddressIds =
				await createManyOrGetExistingAddressesMutation.mutateAsync(
					allAddressesToProcess,
				);

			originAddressIds = allAddressIds.slice(0, data.shipments.length);
			destinationAddressIds = allAddressIds.slice(data.shipments.length);
		} catch (error) {
			toast.error(
				`Failed to process addresses: ${
					error instanceof Error ? error.message : "Unknown error"
				}`,
			);
			setIsLoading(false);
			return;
		}

		const processedShipments = data.shipments.map((shipment, index) => ({
			...shipment,
			originAddressId: originAddressIds[index] ?? "",
			destinationAddressId: destinationAddressIds[index] ?? "",
		}));

		// Client-side validation for each shipment with updated IDs
		const validationResults = await Promise.all(
			processedShipments.map((shipment) =>
				submitShipmentSchema.safeParseAsync(shipment),
			),
		);

		const hasErrors = validationResults.some((result) => !result.success);

		if (hasErrors) {
			for (const [index, result] of validationResults.entries()) {
				if (!result.success) {
					for (const err of result.error.errors) {
						// Map Zod error path to react-hook-form path
						const path = `shipments.${index}.${err.path[0]}`;
						// If the error is on originAddressId or destinationAddressId, apply it to all related fields
						if (err.path[0] === "originAddressId") {
							setError(
								`shipments.${index}.originAddressLine` as Path<TExcelOrderSchema>,
								{ type: "manual", message: err.message },
							);
							setError(
								`shipments.${index}.originZipCode` as Path<TExcelOrderSchema>,
								{ type: "manual", message: err.message },
							);
							setError(
								`shipments.${index}.originCity` as Path<TExcelOrderSchema>,
								{ type: "manual", message: err.message },
							);
							setError(
								`shipments.${index}.originState` as Path<TExcelOrderSchema>,
								{ type: "manual", message: err.message },
							);
						} else if (err.path[0] === "destinationAddressId") {
							setError(
								`shipments.${index}.destinationAddressLine` as Path<TExcelOrderSchema>,
								{ type: "manual", message: err.message },
							);
							setError(
								`shipments.${index}.destinationZipCode` as Path<TExcelOrderSchema>,
								{ type: "manual", message: err.message },
							);
							setError(
								`shipments.${index}.destinationCity` as Path<TExcelOrderSchema>,
								{ type: "manual", message: err.message },
							);
							setError(
								`shipments.${index}.destinationState` as Path<TExcelOrderSchema>,
								{ type: "manual", message: err.message },
							);
						} else {
							setError(path as Path<TExcelOrderSchema>, {
								type: "manual",
								message: err.message,
							});
						}
					}
				}
			}
			toast.error(
				"Some shipments have validation errors after address processing. Please correct them.",
			);
			console.error(
				"Validation errors:",
				validationResults.filter((res) => !res.success),
			);
			setIsLoading(false);
			return;
		}

		createBulkShipmentMutation.mutate({ shipments: processedShipments });
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
						<div className="space-y-2">
							<Label htmlFor="excelFile">Upload Excel File</Label>
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
												<th
													className="whitespace-nowrap px-3 py-3 text-left font-medium text-gray-500 text-xs uppercase tracking-wider"
													style={{ width: "60px" }}
												>
													#
												</th>
												<th
													className="whitespace-nowrap px-3 py-3 text-left font-medium text-gray-500 text-xs uppercase tracking-wider"
													style={{ minWidth: "150px" }}
												>
													Recipient Name
												</th>
												<th
													className="whitespace-nowrap px-3 py-3 text-left font-medium text-gray-500 text-xs uppercase tracking-wider"
													style={{ minWidth: "130px" }}
												>
													Recipient Mobile
												</th>
												<th
													className="whitespace-nowrap px-3 py-3 text-left font-medium text-gray-500 text-xs uppercase tracking-wider"
													style={{ minWidth: "100px" }}
												>
													Weight (kg)
												</th>
												<th
													className="whitespace-nowrap px-3 py-3 text-left font-medium text-gray-500 text-xs uppercase tracking-wider"
													style={{ minWidth: "100px" }}
												>
													Height (cm)
												</th>
												<th
													className="whitespace-nowrap px-3 py-3 text-left font-medium text-gray-500 text-xs uppercase tracking-wider"
													style={{ minWidth: "100px" }}
												>
													Length (cm)
												</th>
												<th
													className="whitespace-nowrap px-3 py-3 text-left font-medium text-gray-500 text-xs uppercase tracking-wider"
													style={{ minWidth: "100px" }}
												>
													Breadth (cm)
												</th>
												<th
													className="px-3 py-3 text-left font-medium text-gray-500 text-xs uppercase tracking-wider"
													style={{ width: "250px" }}
												>
													Origin Address Line
												</th>
												<th
													className="whitespace-nowrap px-3 py-3 text-left font-medium text-gray-500 text-xs uppercase tracking-wider"
													style={{ minWidth: "120px" }}
												>
													Origin Zip Code
												</th>
												<th
													className="whitespace-nowrap px-3 py-3 text-left font-medium text-gray-500 text-xs uppercase tracking-wider"
													style={{ minWidth: "120px" }}
												>
													Origin City
												</th>
												<th
													className="whitespace-nowrap px-3 py-3 text-left font-medium text-gray-500 text-xs uppercase tracking-wider"
													style={{ minWidth: "120px" }}
												>
													Origin State
												</th>
												<th
													className="px-3 py-3 text-left font-medium text-gray-500 text-xs uppercase tracking-wider"
													style={{ width: "250px" }}
												>
													Destination Address Line
												</th>
												<th
													className="whitespace-nowrap px-3 py-3 text-left font-medium text-gray-500 text-xs uppercase tracking-wider"
													style={{ minWidth: "130px" }}
												>
													Destination Zip Code
												</th>
												<th
													className="whitespace-nowrap px-3 py-3 text-left font-medium text-gray-500 text-xs uppercase tracking-wider"
													style={{ minWidth: "130px" }}
												>
													Destination City
												</th>
												<th
													className="whitespace-nowrap px-3 py-3 text-left font-medium text-gray-500 text-xs uppercase tracking-wider"
													style={{ minWidth: "130px" }}
												>
													Destination State
												</th>
												<th
													className="whitespace-nowrap px-3 py-3 text-left font-medium text-gray-500 text-xs uppercase tracking-wider"
													style={{ minWidth: "180px" }}
												>
													Package Image
												</th>
												<th
													className="whitespace-nowrap px-3 py-3 text-left font-medium text-gray-500 text-xs uppercase tracking-wider"
													style={{ minWidth: "120px" }}
												>
													Calculated Rate
												</th>
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
													<td
														className="px-3 py-2 align-top text-gray-500 text-sm"
														style={{ minWidth: "150px" }}
													>
														<Input
															value={shipment.recipientName}
															onChange={(e) => {
																const newValue = e.target.value;
																const newShipments = [...shipments];
																if (newShipments[index]) {
																	newShipments[index].recipientName = newValue;
																	setShipments(newShipments);
																	setValue(
																		`shipments.${index}.recipientName` as Path<TExcelOrderSchema>,
																		newValue,
																	);
																	trigger(
																		`shipments.${index}.recipientName` as Path<TExcelOrderSchema>,
																	);
																}
															}}
															className={`w-full ${
																errors.shipments?.[index]?.recipientName
																	?.message
																	? "border-red-500"
																	: ""
															}`}
														/>
														<FieldError
															message={
																errors.shipments?.[index]?.recipientName
																	?.message
															}
														/>
													</td>
													<td
														className="px-3 py-2 align-top text-gray-500 text-sm"
														style={{ minWidth: "130px" }}
													>
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
																		`shipments.${index}.recipientMobile` as Path<TExcelOrderSchema>,
																		newValue,
																	);
																	trigger(
																		`shipments.${index}.recipientMobile` as Path<TExcelOrderSchema>,
																	);
																}
															}}
															className={`w-full ${
																errors.shipments?.[index]?.recipientMobile
																	?.message
																	? "border-red-500"
																	: ""
															}`}
														/>
														<FieldError
															message={
																errors.shipments?.[index]?.recipientMobile
																	?.message
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
															value={shipment.packageWeight}
															onChange={(e) => {
																const newValue = Number(e.target.value);
																const newShipments = [...shipments];
																if (newShipments[index]) {
																	newShipments[index].packageWeight = newValue;
																	setShipments(newShipments);
																	setValue(
																		`shipments.${index}.packageWeight` as Path<TExcelOrderSchema>,
																		newValue,
																	);
																	trigger(
																		`shipments.${index}.packageWeight` as Path<TExcelOrderSchema>,
																	);
																}
															}}
															className={`w-full ${
																errors.shipments?.[index]?.packageWeight
																	?.message
																	? "border-red-500"
																	: ""
															}`}
														/>
														<FieldError
															message={
																errors.shipments?.[index]?.packageWeight
																	?.message
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
															value={shipment.packageHeight}
															onChange={(e) => {
																const newValue = Number(e.target.value);
																const newShipments = [...shipments];
																if (newShipments[index]) {
																	newShipments[index].packageHeight = newValue;
																	setShipments(newShipments);
																	setValue(
																		`shipments.${index}.packageHeight` as Path<TExcelOrderSchema>,
																		newValue,
																	);
																	trigger(
																		`shipments.${index}.packageHeight` as Path<TExcelOrderSchema>,
																	);
																}
															}}
															className={`w-full ${
																errors.shipments?.[index]?.packageHeight
																	?.message
																	? "border-red-500"
																	: ""
															}`}
														/>
														<FieldError
															message={
																errors.shipments?.[index]?.packageHeight
																	?.message
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
															value={shipment.packageLength}
															onChange={(e) => {
																const newValue = Number(e.target.value);
																const newShipments = [...shipments];
																if (newShipments[index]) {
																	newShipments[index].packageLength = newValue;
																	setShipments(newShipments);
																	setValue(
																		`shipments.${index}.packageLength` as Path<TExcelOrderSchema>,
																		newValue,
																	);
																	trigger(
																		`shipments.${index}.packageLength` as Path<TExcelOrderSchema>,
																	);
																}
															}}
															className={`w-full ${
																errors.shipments?.[index]?.packageLength
																	?.message
																	? "border-red-500"
																	: ""
															}`}
														/>
														<FieldError
															message={
																errors.shipments?.[index]?.packageLength
																	?.message
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
															value={shipment.packageBreadth}
															onChange={(e) => {
																const newValue = Number(e.target.value);
																const newShipments = [...shipments];
																if (newShipments[index]) {
																	newShipments[index].packageBreadth = newValue;
																	setShipments(newShipments);
																	setValue(
																		`shipments.${index}.packageBreadth` as Path<TExcelOrderSchema>,
																		newValue,
																	);
																	trigger(
																		`shipments.${index}.packageBreadth` as Path<TExcelOrderSchema>,
																	);
																}
															}}
															className={`w-full ${
																errors.shipments?.[index]?.packageBreadth
																	?.message
																	? "border-red-500"
																	: ""
															}`}
														/>
														<FieldError
															message={
																errors.shipments?.[index]?.packageBreadth
																	?.message
															}
														/>
													</td>
													{/* origin address fields */}
													<td
														className="px-3 py-2 align-top text-gray-500 text-sm"
														style={{ width: "250px" }}
													>
														<textarea
															value={shipment.originAddressLine}
															onChange={(e) => {
																const newValue = e.target.value;
																const newShipments = [...shipments];
																if (newShipments[index]) {
																	newShipments[index].originAddressLine =
																		newValue;
																	setShipments(newShipments);
																	setValue(
																		`shipments.${index}.originAddressLine` as Path<TExcelOrderSchema>,
																		newValue,
																	);
																	trigger(
																		`shipments.${index}.originAddressLine` as Path<TExcelOrderSchema>,
																	);
																}
															}}
															className={`w-full resize-none rounded border px-2 py-1 text-sm ${
																errors.shipments?.[index]?.originAddressLine ||
																errors.shipments?.[index]?.originZipCode ||
																errors.shipments?.[index]?.originCity ||
																errors.shipments?.[index]?.originState
																	? "border-red-500"
																	: "border-gray-300"
															}`}
															rows={2}
														/>
														<FieldError
															message={
																errors.shipments?.[index]?.originAddressLine
																	?.message ||
																errors.shipments?.[index]?.originZipCode
																	?.message ||
																errors.shipments?.[index]?.originCity
																	?.message ||
																errors.shipments?.[index]?.originState?.message
															}
														/>
													</td>
													<td
														className="px-3 py-2 align-top text-gray-500 text-sm"
														style={{ minWidth: "120px" }}
													>
														<Input
															value={shipment.originZipCode}
															onChange={(e) => {
																const newValue = e.target.value;
																const newShipments = [...shipments];
																if (newShipments[index]) {
																	newShipments[index].originZipCode = newValue;
																	setShipments(newShipments);
																	setValue(
																		`shipments.${index}.originZipCode` as Path<TExcelOrderSchema>,
																		newValue,
																	);
																	trigger(
																		`shipments.${index}.originZipCode` as Path<TExcelOrderSchema>,
																	);
																}
															}}
															className={`w-full ${
																errors.shipments?.[index]?.originZipCode ||
																errors.shipments?.[index]?.originCity ||
																errors.shipments?.[index]?.originState
																	? "border-red-500"
																	: ""
															}`}
														/>
														<FieldError
															message={
																errors.shipments?.[index]?.originZipCode
																	?.message ||
																errors.shipments?.[index]?.originCity
																	?.message ||
																errors.shipments?.[index]?.originState?.message
															}
														/>
													</td>
													<td
														className="px-3 py-2 align-top text-gray-500 text-sm"
														style={{ minWidth: "120px" }}
													>
														<Input
															value={shipment.originCity}
															onChange={(e) => {
																const newValue = e.target.value;
																const newShipments = [...shipments];
																if (newShipments[index]) {
																	newShipments[index].originCity = newValue;
																	setShipments(newShipments);
																	setValue(
																		`shipments.${index}.originCity` as Path<TExcelOrderSchema>,
																		newValue,
																	);
																	trigger(
																		`shipments.${index}.originCity` as Path<TExcelOrderSchema>,
																	);
																}
															}}
															className={`w-full ${
																errors.shipments?.[index]?.originCity
																	?.message ||
																errors.shipments?.[index]?.originState?.message
																	? "border-red-500"
																	: ""
															}`}
														/>
														<FieldError
															message={
																errors.shipments?.[index]?.originCity
																	?.message ||
																errors.shipments?.[index]?.originState?.message
															}
														/>
													</td>
													<td
														className="px-3 py-2 align-top text-gray-500 text-sm"
														style={{ minWidth: "120px" }}
													>
														<Input
															value={shipment.originState}
															onChange={(e) => {
																const newValue = e.target.value;
																const newShipments = [...shipments];
																if (newShipments[index]) {
																	newShipments[index].originState = newValue;
																	setShipments(newShipments);
																	setValue(
																		`shipments.${index}.originState` as Path<TExcelOrderSchema>,
																		newValue,
																	);
																	trigger(
																		`shipments.${index}.originState` as Path<TExcelOrderSchema>,
																	);
																}
															}}
															className={`w-full ${
																errors.shipments?.[index]?.originState?.message
																	? "border-red-500"
																	: ""
															}`}
														/>
														<FieldError
															message={
																errors.shipments?.[index]?.originState?.message
															}
														/>
													</td>
													{/* destination address fields */}
													<td
														className="px-3 py-2 align-top text-gray-500 text-sm"
														style={{ width: "250px" }}
													>
														<textarea
															value={shipment.destinationAddressLine}
															onChange={(e) => {
																const newValue = e.target.value;
																const newShipments = [...shipments];
																if (newShipments[index]) {
																	newShipments[index].destinationAddressLine =
																		newValue;
																	setShipments(newShipments);
																	setValue(
																		`shipments.${index}.destinationAddressLine` as Path<TExcelOrderSchema>,
																		newValue,
																	);
																	trigger(
																		`shipments.${index}.destinationAddressLine` as Path<TExcelOrderSchema>,
																	);
																}
															}}
															className={`w-full resize-none rounded border px-2 py-1 text-sm ${
																errors.shipments?.[index]
																	?.destinationAddressLine ||
																errors.shipments?.[index]?.destinationZipCode ||
																errors.shipments?.[index]?.destinationCity ||
																errors.shipments?.[index]?.destinationState
																	? "border-red-500"
																	: "border-gray-300"
															}`}
															rows={2}
														/>
														<FieldError
															message={
																errors.shipments?.[index]
																	?.destinationAddressLine?.message ||
																errors.shipments?.[index]?.destinationZipCode
																	?.message ||
																errors.shipments?.[index]?.destinationCity
																	?.message ||
																errors.shipments?.[index]?.destinationState
																	?.message
															}
														/>
													</td>
													<td
														className="px-3 py-2 align-top text-gray-500 text-sm"
														style={{ minWidth: "130px" }}
													>
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
																		`shipments.${index}.destinationZipCode` as Path<TExcelOrderSchema>,
																		newValue,
																	);
																	trigger(
																		`shipments.${index}.destinationZipCode` as Path<TExcelOrderSchema>,
																	);
																}
															}}
															className={`w-full ${
																errors.shipments?.[index]?.destinationZipCode ||
																errors.shipments?.[index]?.destinationCity ||
																errors.shipments?.[index]?.destinationState
																	? "border-red-500"
																	: ""
															}`}
														/>
														<FieldError
															message={
																errors.shipments?.[index]?.destinationZipCode
																	?.message ||
																errors.shipments?.[index]?.destinationCity
																	?.message ||
																errors.shipments?.[index]?.destinationState
																	?.message
															}
														/>
													</td>
													<td
														className="px-3 py-2 align-top text-gray-500 text-sm"
														style={{ minWidth: "130px" }}
													>
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
																		`shipments.${index}.destinationCity` as Path<TExcelOrderSchema>,
																		newValue,
																	);
																	trigger(
																		`shipments.${index}.destinationCity` as Path<TExcelOrderSchema>,
																	);
																}
															}}
															className={`w-full ${
																errors.shipments?.[index]?.destinationCity
																	?.message ||
																errors.shipments?.[index]?.destinationState
																	?.message
																	? "border-red-500"
																	: ""
															}`}
														/>
														<FieldError
															message={
																errors.shipments?.[index]?.destinationCity
																	?.message ||
																errors.shipments?.[index]?.destinationState
																	?.message
															}
														/>
													</td>
													<td
														className="px-3 py-2 align-top text-gray-500 text-sm"
														style={{ minWidth: "130px" }}
													>
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
																		`shipments.${index}.destinationState` as Path<TExcelOrderSchema>,
																		newValue,
																	);
																	trigger(
																		`shipments.${index}.destinationState` as Path<TExcelOrderSchema>,
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
														<FieldError
															message={
																errors.shipments?.[index]?.destinationState
																	?.message
															}
														/>
													</td>
													{/* package image */}
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
														{shipment.packageImage?.data && (
															<Image
																src={shipment.packageImage.data}
																alt="Package Preview"
																className="h-16 w-16 rounded border object-cover"
																width={64}
																height={64}
															/>
														)}
														<FieldError
															message={
																errors.shipments?.[index]?.packageImage
																	?.message as string
															}
														/>
													</td>
													<td
														className="px-3 py-2 align-top text-gray-500 text-sm"
														style={{ minWidth: "120px" }}
													>
														{shipment.calculatedRate !== null &&
														shipment.calculatedRate !== undefined
															? `₹${shipment.calculatedRate.toFixed(2)}`
															: "N/A"}
													</td>
												</tr>
											))}
										</tbody>
									</table>
								</div>
							</div>
						)}
						{shipments.length > 0 && (
							<Button
								type="button"
								onClick={handleCalculateRates}
								disabled={isCalculatingBulkRates || isLoading}
								className="w-full"
							>
								{isCalculatingBulkRates ? "Calculating..." : "Calculate Rates"}
							</Button>
						)}

						{totalCalculatedRate !== null && (
							<div className="mt-4 text-right font-semibold text-xl">
								Total Estimated Rate: ₹{totalCalculatedRate.toFixed(2)}
							</div>
						)}

						<Button
							type="submit"
							className="w-full"
							disabled={
								isLoading ||
								shipments.length === 0 ||
								createBulkShipmentMutation.isPending ||
								totalCalculatedRate === null
							}
						>
							{isLoading ? "Creating..." : "Create Bulk Shipments"}
						</Button>
					</form>
				</CardContent>
			</Card>
		</div>
	);
}
