"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ADDRESS_TYPE } from "@prisma/client";
import { PlusCircle } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { AddAddressModal } from "~/components/AddAddressModal";
import { FieldError } from "~/components/FieldError";
import { Button } from "~/components/ui/button";
import {
	Card,
	CardContent,
	CardFooter,
	CardHeader,
} from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import {
	InputOTP,
	InputOTPGroup,
	InputOTPSlot,
} from "~/components/ui/input-otp";
import { Label } from "~/components/ui/label";
import { fileToBase64 } from "~/lib/file-utils";
import type { TFileSchema } from "~/schemas/file";
import { type TShipmentSchema, submitShipmentSchema } from "~/schemas/shipment";
import { api } from "~/trpc/react";

interface PincodeDetails {
	city: string;
	state: string;
}

export default function CreateShipmentPage() {
	const router = useRouter();
	const [isLoading, setIsLoading] = useState(false);
	const [showOriginAddressModal, setShowOriginAddressModal] = useState(false);
	const [autofilledAddressDetails, setAutofilledAddressDetails] = useState<
		NonNullable<typeof userAddresses>[number] | undefined
	>(undefined);
	const [originZipCodeFilter, setOriginZipCodeFilter] = useState("");
	const [packageImagePreview, setPackageImagePreview] = useState<string | null>(
		null,
	);
	const [invoicePreview, setInvoicePreview] = useState<string | null>(null);
	const [calculatedRate, setCalculatedRate] = useState<{
		rate: number;
		insurancePremium: number;
		compensationAmount: number;
	} | null>(null);
	const [origin, setOrigin] = useState<PincodeDetails | null>(null);
	const [destination, setDestination] = useState<PincodeDetails | null>(null);

	const {
		register,
		handleSubmit,
		setValue,
		watch,
		formState: { errors },
		getValues,
	} = useForm<TShipmentSchema>({
		resolver: zodResolver(submitShipmentSchema),
	});

	const handleFileChange = async (
		event: React.ChangeEvent<HTMLInputElement>,
		fieldName: "packageImage" | "invoice",
		setPreview: React.Dispatch<React.SetStateAction<string | null>>,
	) => {
		const file = event.target.files?.[0];
		if (file) {
			setPreview(URL.createObjectURL(file));

			try {
				const base64Data = await fileToBase64(file);
				setValue(fieldName, {
					data: base64Data,
					name: file.name,
					type: file.type,
					size: file.size,
				} as TFileSchema);
			} catch (error) {
				console.error("Error converting file to Base64:", error);
				toast.error("Failed to process file");
				setValue(fieldName, {
					data: "",
					name: "",
					type: "",
					size: 0,
				} as TFileSchema);
				setPreview(null);
			}
		} else {
			setValue(fieldName, {
				data: "",
				name: "",
				type: "",
				size: 0,
			} as TFileSchema);
			setPreview(null);
		}
	};

	const {
		data: warehouseAddresses,
		isLoading: isLoadingWarehouseAddresses,
		refetch: refetchWarehouseAddresses,
	} = api.address.getAddresses.useQuery({ type: ADDRESS_TYPE.Warehouse });
	const { data: userAddresses } = api.address.getAddresses.useQuery({
		type: ADDRESS_TYPE.User,
	});

	const addAddressMutation = api.address.createAddress.useMutation();

	const filteredWarehouseAddresses = useMemo(() => {
		if (!warehouseAddresses) return undefined;
		return warehouseAddresses.filter((address) =>
			String(address.zip_code).includes(originZipCodeFilter),
		);
	}, [warehouseAddresses, originZipCodeFilter]);

	const [destinationAddress, setDestinationAddress] = useState({
		zipCode: "",
		addressLine: "",
		city: "",
		state: "",
	});
	const recipientName = watch("recipientName");

	useEffect(() => {
		if (userAddresses && recipientName) {
			const potentialAddresses = userAddresses.filter(
				(address) => address.name.toLowerCase() === recipientName.toLowerCase(),
			);

			if (potentialAddresses.length === 1) {
				const matchedAddress = potentialAddresses[0];
				if (matchedAddress) {
					setValue("destinationAddressId", matchedAddress.address_id);
					setDestinationAddress({
						zipCode: String(matchedAddress.zip_code),
						addressLine: matchedAddress.address_line,
						city: matchedAddress.city,
						state: matchedAddress.state,
					});
					setAutofilledAddressDetails(matchedAddress);
				}
			} else {
				setValue("destinationAddressId", "");
				setAutofilledAddressDetails(undefined);
			}
		} else {
			setValue("destinationAddressId", "");
			setAutofilledAddressDetails(undefined);
			setDestinationAddress({
				zipCode: "",
				addressLine: "",
				city: "",
				state: "",
			});
		}
	}, [userAddresses, recipientName, setValue]);

	const createShipmentMutation = api.shipment.createShipment.useMutation({
		onSuccess: () => {
			setIsLoading(false);
			toast.success("Shipment created successfully! Redirecting...");
			setTimeout(() => {
				router.push("/dashboard/shipments");
			}, 2000);
		},
		onError(err) {
			toast.error(err.message);
			setIsLoading(false);
		},
	});

	const [queryInput, setQueryInput] = useState<{
		originZipCode: string;
		destinationZipCode: string;
		packageWeight: number;
		isInsuranceSelected?: boolean;
	} | null>(null);

	const {
		data: rateData,
		error: rateError,
		isFetching: isCalculatingRate,
	} = api.rate.calculateRate.useQuery(
		queryInput ?? {
			originZipCode: "",
			destinationZipCode: "",
			packageWeight: 0,
		},
		{
			enabled: !!queryInput,
			staleTime: Number.POSITIVE_INFINITY, // Prevent refetching on focus
		},
	);

	useEffect(() => {
		if (rateData) {
			setCalculatedRate({
				rate: rateData.rate,
				insurancePremium: rateData.insurancePremium ?? 0,
				compensationAmount: rateData.compensationAmount ?? 0,
			});
			setOrigin(rateData.origin);
			setDestination(rateData.destination);
			setQueryInput(null);
			toast.success("Rate calculated successfully!");
		}
	}, [rateData]);

	useEffect(() => {
		if (rateError) {
			toast.error(rateError.message);
			setCalculatedRate(null);
			setQueryInput(null);
		}
	}, [rateError]);

	const handleCalculateRate = () => {
		const data = getValues();
		const originAddress = warehouseAddresses?.find(
			(address) => address.address_id === data.originAddressId,
		);

		if (!originAddress || !destinationAddress.zipCode || !data.packageWeight) {
			toast.error(
				"Please select origin, destination, and enter package weight.",
			);
			return;
		}

		setQueryInput({
			originZipCode: String(originAddress.zip_code),
			destinationZipCode: destinationAddress.zipCode,
			packageWeight: data.packageWeight,
			isInsuranceSelected: data.isInsuranceSelected,
		});
	};

	const onSubmit = async (data: TShipmentSchema) => {
		setIsLoading(true);

		let finalDestinationAddressId = data.destinationAddressId;

		if (finalDestinationAddressId && autofilledAddressDetails) {
			if (
				destinationAddress.addressLine !==
					autofilledAddressDetails.address_line ||
				Number(destinationAddress.zipCode) !==
					autofilledAddressDetails.zip_code ||
				destinationAddress.city !== autofilledAddressDetails.city ||
				destinationAddress.state !== autofilledAddressDetails.state
			) {
				finalDestinationAddressId = "";
			}
		}

		if (!finalDestinationAddressId) {
			try {
				const newAddress = await addAddressMutation.mutateAsync({
					name: data.recipientName,
					addressLine: destinationAddress.addressLine,
					zipCode: Number(destinationAddress.zipCode),
					city: destinationAddress.city,
					state: destinationAddress.state,
					type: ADDRESS_TYPE.User,
				});

				if ("address_id" in newAddress) {
					finalDestinationAddressId = newAddress.address_id;
				} else {
					toast.error("Failed to retrieve address ID for new address.");
					setIsLoading(false);
					return;
				}
			} catch (error) {
				let message = "Failed to add new destination address.";
				if (error instanceof Error) {
					message = error.message;
				}
				toast.error(message);
				setIsLoading(false);
				return;
			}
		}

		createShipmentMutation.mutate({
			...data,
			destinationAddressId: finalDestinationAddressId,
			declaredValue: data.declaredValue,
			isInsuranceSelected: data.isInsuranceSelected,
		});
	};

	return (
		<div className="flex min-h-screen items-center justify-center p-4">
			<Card className="w-full bg-blue-100/20">
				<AddAddressModal
					isOpen={showOriginAddressModal}
					onClose={() => setShowOriginAddressModal(false)}
					onAddressAdded={() => refetchWarehouseAddresses()}
					addressType={ADDRESS_TYPE.Warehouse}
				/>
				<CardHeader>
					<h1 className="text-center font-semibold text-2xl text-blue-950">
						Create Shipment
					</h1>
					<p className="text-center text-blue-900 text-sm">
						Enter the shipment details.
					</p>
				</CardHeader>
				<CardContent>
					<form
						onSubmit={handleSubmit(onSubmit)}
						className="space-y-4 text-blue-950"
					>
						<div className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
							<div className="space-y-4">
								<Label>Recipient Name</Label>
								<Input {...register("recipientName")} disabled={isLoading} />
								<FieldError message={errors.recipientName?.message} />
							</div>
							<div className="space-y-4">
								<Label>Recipient Mobile Number</Label>
								<InputOTP
									maxLength={10}
									value={watch("recipientMobile")}
									onChange={(val) => setValue("recipientMobile", val)}
									disabled={isLoading}
									pattern="\d*"
									inputMode="numeric"
								>
									<InputOTPGroup>
										{[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
											<InputOTPSlot key={i} index={i} />
										))}
									</InputOTPGroup>
								</InputOTP>
								<FieldError message={errors.recipientMobile?.message} />
							</div>
						</div>

						<div className="space-y-4">
							<Label className="font-bold">Destination Address</Label>
							<div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2">
								<div className="space-y-2">
									<Label>Zip Code</Label>
									<Input
										value={destinationAddress.zipCode}
										onChange={(e) =>
											setDestinationAddress((prev) => ({
												...prev,
												zipCode: e.target.value,
											}))
										}
										disabled={isLoading}
									/>
									<FieldError message={errors.destinationAddressId?.message} />
								</div>
								<div className="space-y-2">
									<Label>Address Line</Label>
									<Input
										value={destinationAddress.addressLine}
										onChange={(e) =>
											setDestinationAddress((prev) => ({
												...prev,
												addressLine: e.target.value,
											}))
										}
										disabled={isLoading}
									/>
									<FieldError message={errors.destinationAddressId?.message} />
								</div>
								<div className="space-y-2">
									<Label>City</Label>
									<Input
										value={destinationAddress.city}
										onChange={(e) =>
											setDestinationAddress((prev) => ({
												...prev,
												city: e.target.value,
											}))
										}
										disabled={isLoading}
									/>
									<FieldError message={errors.destinationAddressId?.message} />
								</div>
								<div className="space-y-2">
									<Label>State</Label>
									<Input
										value={destinationAddress.state}
										onChange={(e) =>
											setDestinationAddress((prev) => ({
												...prev,
												state: e.target.value,
											}))
										}
										disabled={isLoading}
									/>
									<FieldError message={errors.destinationAddressId?.message} />
								</div>
							</div>
							<FieldError message={errors.destinationAddressId?.message} />
						</div>

						<div className="space-y-4">
							<Label className="font-bold">Origin Address</Label>
							<Input
								placeholder="Search by Pin Code"
								onChange={(e) => setOriginZipCodeFilter(e.target.value)}
								className="mb-2"
							/>
							{isLoadingWarehouseAddresses ? (
								<p>Loading origin addresses...</p>
							) : (
								<div className="flex gap-4 overflow-x-auto p-4">
									{filteredWarehouseAddresses?.map((address) => (
										<Card
											key={address.address_id}
											className={`h-48 w-96 flex-shrink-0 cursor-pointer bg-blue-100 hover:bg-blue-200 ${
												watch("originAddressId") === address.address_id
													? "border-blue-500 ring-1 ring-blue-500"
													: ""
											}`}
											onClick={() =>
												setValue("originAddressId", address.address_id)
											}
										>
											<CardHeader>
												<h3 className="font-semibold">{address.name}</h3>
											</CardHeader>
											<CardContent>
												<p>{address.address_line}</p>
												<p>
													{address.city}, {address.state} - {address.zip_code}
												</p>
											</CardContent>
										</Card>
									))}
									<Button
										type="button"
										variant="outline"
										className="h-48 w-96 bg-blue-200 hover:bg-blue-300"
										onClick={() => setShowOriginAddressModal(true)}
									>
										<PlusCircle className="mr-2 h-4 w-4" /> Add New Origin
										Address
									</Button>
								</div>
							)}
							<FieldError message={errors.originAddressId?.message} />
						</div>

						<div className="space-y-4">
							<Label className="font-bold">Package Details</Label>
							<div className="mb-10 grid grid-cols-1 gap-10 p-4 sm:grid-cols-2">
								<div className="space-y-2">
									<Label>Package Weight</Label>
									<Input
										placeholder="Package Weight (in kg)"
										type="number"
										step="any"
										{...register("packageWeight", {
											valueAsNumber: true,
										})}
									/>
									<FieldError message={errors.packageWeight?.message} />
								</div>
								<div className="space-y-2">
									<Label>Package Height</Label>
									<Input
										placeholder="Package Height (in cm)"
										type="number"
										step="any"
										{...register("packageHeight", {
											valueAsNumber: true,
										})}
									/>
									<FieldError message={errors.packageHeight?.message} />
								</div>
								<div className="space-y-2">
									<Label>Package Breadth</Label>
									<Input
										placeholder="Package Breadth (in cm)"
										type="number"
										step="any"
										{...register("packageBreadth", {
											valueAsNumber: true,
										})}
									/>
									<FieldError message={errors.packageBreadth?.message} />
								</div>
								<div className="space-y-2">
									<Label>Package Length</Label>
									<Input
										placeholder="Package Length (in cm)"
										type="number"
										step="any"
										{...register("packageLength", {
											valueAsNumber: true,
										})}
									/>
									<FieldError message={errors.packageLength?.message} />
								</div>
								<div className="space-y-2">
									<Label>Package Weight Image</Label>
									<div className="relative flex h-32 w-32 items-center justify-center rounded border bg-gray-100">
										{packageImagePreview ? (
											<Image
												src={packageImagePreview}
												alt="Package Image Preview"
												className="h-full w-full object-cover"
												width={200}
												height={200}
											/>
										) : (
											<Image
												src="/sample_package_image.jpeg"
												alt="Sample Package Image"
												className="h-full w-full object-cover"
												width={200}
												height={200}
											/>
										)}
									</div>
									<Input
										type="file"
										accept="image/*"
										onChange={(e) => {
											handleFileChange(
												e,
												"packageImage",
												setPackageImagePreview,
											);
										}}
									/>
									<FieldError
										message={errors.packageImage?.message as string}
									/>
								</div>
								<div className="space-y-2">
									<Label>Declared Value (₹)</Label>
									<Input
										placeholder="Declared Value"
										type="number"
										step="1"
										{...register("declaredValue", {
											valueAsNumber: true,
										})}
									/>
									<FieldError message={errors.declaredValue?.message} />
									<div className="flex items-center space-x-2">
										<Input
											id="isInsuranceSelected"
											type="checkbox"
											{...register("isInsuranceSelected")}
											className="h-4 w-4"
										/>
										<Label htmlFor="isInsuranceSelected">
											Opt for Insurance
										</Label>
										<Link
											href="/insurance-rates"
											className="text-blue-500 text-sm hover:underline"
											target="_blank"
										>
											(View Rates)
										</Link>
									</div>
									<div
										className={`space-y-2 ${!watch("isInsuranceSelected") ? "invisible h-0" : ""}`}
									>
										<Label>Invoice</Label>
										<Input
											type="file"
											accept="application/pdf,image/*"
											onChange={(e) => {
												handleFileChange(e, "invoice", setInvoicePreview);
											}}
										/>
										{invoicePreview && (
											<p className="text-muted-foreground text-sm">
												File selected: {invoicePreview.split("/").pop()}
											</p>
										)}
										<FieldError message={errors.invoice?.message as string} />
									</div>
								</div>
							</div>
						</div>
						<Button
							type="button"
							onClick={handleCalculateRate}
							disabled={isCalculatingRate}
						>
							{isCalculatingRate ? "Calculating..." : "Calculate Rate"}
						</Button>
						<div
							className={`font-semibold text-lg ${!calculatedRate ? "invisible h-0" : ""}`}
						>
							Calculated Rate: ₹{calculatedRate?.rate.toFixed(2)}
							{calculatedRate?.insurancePremium &&
								calculatedRate.insurancePremium > 0 && (
									<p className="font-normal text-green-600 text-sm">
										(Includes Insurance Premium: ₹
										{calculatedRate.insurancePremium.toFixed(2)}
										{calculatedRate.compensationAmount > 0 &&
											`, Compensation: ₹${calculatedRate.compensationAmount.toFixed(
												2,
											)}`}
										)
									</p>
								)}
							{origin && destination && (
								<div className="font-normal text-sm">
									From: {origin.city}, {origin.state}
									<br />
									To: {destination.city}, {destination.state}
								</div>
							)}
						</div>
						<Button
							type="submit"
							className="w-full"
							disabled={
								isLoading || !calculatedRate || createShipmentMutation.isPending
							}
						>
							{isLoading ? "Creating..." : "Create Shipment"}
						</Button>
					</form>
				</CardContent>
				<CardFooter className="justify-center">
					<p className="text-muted-foreground text-sm">
						Need help?{" "}
						<Link
							href="/dashboard/support"
							className="text-primary hover:underline"
						>
							Contact Support
						</Link>
					</p>
				</CardFooter>
			</Card>
		</div>
	);
}
