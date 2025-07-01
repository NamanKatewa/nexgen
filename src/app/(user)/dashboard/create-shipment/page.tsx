"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ADDRESS_TYPE } from "@prisma/client";
import { AlertCircle, PlusCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { AddAddressModal } from "~/components/AddAddressModal";
import { FieldError } from "~/components/FieldError";
import { Alert, AlertDescription } from "~/components/ui/alert";
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
import { type TShipmentSchema, submitShipmentSchema } from "~/schemas/order";
import { api } from "~/trpc/react";

export default function CreateShipmentPage() {
	const router = useRouter();
	const [errorMessage, setErrorMessage] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [showOriginAddressModal, setShowOriginAddressModal] = useState(false);
	const [showDestinationAddressModal, setShowDestinationAddressModal] =
		useState(false);
	const [originZipCodeFilter, setOriginZipCodeFilter] = useState("");
	const [destinationZipCodeFilter, setDestinationZipCodeFilter] = useState("");

	const {
		register,
		handleSubmit,
		setValue,
		watch,
		formState: { errors },
	} = useForm<TShipmentSchema>({
		resolver: zodResolver(submitShipmentSchema),
	});

	const {
		data: warehouseAddresses,
		isLoading: isLoadingWarehouseAddresses,
		refetch: refetchWarehouseAddresses,
	} = api.address.getAddresses.useQuery({ type: ADDRESS_TYPE.Warehouse });
	const {
		data: userAddresses,
		isLoading: isLoadingUserAddresses,
		refetch: refetchUserAddresses,
	} = api.address.getAddresses.useQuery({ type: ADDRESS_TYPE.User });

	const [filteredWarehouseAddresses, setFilteredWarehouseAddresses] = useState<
		typeof warehouseAddresses | undefined
	>(undefined);
	const [filteredUserAddresses, setFilteredUserAddresses] = useState<
		typeof userAddresses | undefined
	>(undefined);

	useEffect(() => {
		if (warehouseAddresses) {
			setFilteredWarehouseAddresses(warehouseAddresses);
		}
	}, [warehouseAddresses]);

	useEffect(() => {
		if (userAddresses) {
			setFilteredUserAddresses(userAddresses);
		}
	}, [userAddresses]);

	useEffect(() => {
		if (warehouseAddresses) {
			setFilteredWarehouseAddresses(
				warehouseAddresses.filter((address) =>
					String(address.zip_code).includes(originZipCodeFilter),
				),
			);
		}
	}, [warehouseAddresses, originZipCodeFilter]);

	useEffect(() => {
		if (userAddresses) {
			setFilteredUserAddresses(
				userAddresses.filter((address) =>
					String(address.zip_code).includes(destinationZipCodeFilter),
				),
			);
		}
	}, [userAddresses, destinationZipCodeFilter]);

	const createShipmentMutation = api.order.createShipment.useMutation({
		onSuccess: () => {
			setIsLoading(false);
			router.push("/dashboard/");
		},
		onError(err) {
			setErrorMessage(err.message);
			setIsLoading(false);
		},
	});

	const onSubmit = async (data: TShipmentSchema) => {
		setIsLoading(true);
		setErrorMessage("");
		createShipmentMutation.mutate(data);
	};

	return (
		<div className="flex min-h-screen items-center justify-center p-4">
			<Card className="w-full bg-blue-100/20">
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
						{errorMessage && (
							<Alert variant="destructive">
								<AlertCircle className="h-4 w-4" />
								<AlertDescription>{errorMessage}</AlertDescription>
							</Alert>
						)}

						<div className="space-y-2">
							<Label>Origin Address</Label>
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
								</div>
							)}
							<FieldError message={errors.originAddressId?.message} />
							<Button
								variant="outline"
								className="mt-2 w-full bg-blue-200 hover:bg-blue-300"
								onClick={() => setShowOriginAddressModal(true)}
							>
								<PlusCircle className="mr-2 h-4 w-4" /> Add New Origin Address
							</Button>
						</div>

						<div className="space-y-2">
							<Label>Destination Address</Label>
							<Input
								placeholder="Search by Zip Code"
								onChange={(e) => setDestinationZipCodeFilter(e.target.value)}
								className="mb-2"
							/>
							{isLoadingUserAddresses ? (
								<p>Loading destination addresses...</p>
							) : (
								<div className="flex gap-4 overflow-x-auto p-4">
									{filteredUserAddresses?.map((address) => (
										<Card
											key={address.address_id}
											className={`h-48 w-96 flex-shrink-0 cursor-pointer bg-blue-100 hover:bg-blue-200 ${
												watch("destinationAddressId") === address.address_id
													? "border-blue-500 ring-1 ring-blue-500"
													: ""
											}`}
											onClick={() =>
												setValue("destinationAddressId", address.address_id)
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
								</div>
							)}
							<FieldError message={errors.destinationAddressId?.message} />
							<Button
								variant="outline"
								className="mt-2 w-full bg-blue-200 hover:bg-blue-300"
								onClick={() => setShowDestinationAddressModal(true)}
							>
								<PlusCircle className="mr-2 h-4 w-4" /> Add New Destination
								Address
							</Button>
						</div>

						<div className="mb-10 flex gap-10">
							<div className="space-y-2">
								<Label>Recipient Name</Label>
								<Input {...register("recipientName")} disabled={isLoading} />
								<FieldError message={errors.recipientName?.message} />
							</div>
							<div className="mb-10 flex flex-wrap gap-10">
								<div className="space-y-2">
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
						</div>

						<div className="space-y-2">
							<Label>Package Details</Label>
							<div className="mb-10 grid grid-cols-2 gap-10">
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
							</div>
						</div>

						<Button type="submit" className="w-full" disabled={isLoading}>
							{isLoading || createShipmentMutation.isPending
								? "Creating..."
								: "Create Shipment"}
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

			<AddAddressModal
				isOpen={showOriginAddressModal}
				onClose={() => setShowOriginAddressModal(false)}
				onAddressAdded={refetchWarehouseAddresses}
				addressType={ADDRESS_TYPE.Warehouse}
			/>

			<AddAddressModal
				isOpen={showDestinationAddressModal}
				onClose={() => setShowDestinationAddressModal(false)}
				onAddressAdded={refetchUserAddresses}
				addressType={ADDRESS_TYPE.User}
			/>
		</div>
	);
}
