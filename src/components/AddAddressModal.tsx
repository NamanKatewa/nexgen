import { zodResolver } from "@hookform/resolvers/zod";
import type { ADDRESS_TYPE } from "@prisma/client";
import { AlertCircle } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Alert, AlertDescription } from "~/components/ui/alert";
import { Button } from "~/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { type TAddressSchema, addressSchema } from "~/schemas/address";
import { api } from "~/trpc/react";

interface AddAddressModalProps {
	isOpen: boolean;
	onClose: () => void;
	onAddressAdded: () => void;
	addressType: ADDRESS_TYPE;
}

export function AddAddressModal({
	isOpen,
	onClose,
	onAddressAdded,
	addressType,
}: AddAddressModalProps) {
	const [errorMessage, setErrorMessage] = useState("");
	const [isLoading, setIsLoading] = useState(false);

	const {
		register,
		handleSubmit,
		reset,
		formState: { errors },
	} = useForm<TAddressSchema>({
		resolver: zodResolver(addressSchema),
	});

	const createAddressMutation = api.address.createAddress.useMutation({
		onSuccess: () => {
			setIsLoading(false);
			onAddressAdded();
			reset();
			onClose();
		},
		onError: (error) => {
			setErrorMessage(
				error.message || "Something went wrong. Please try again.",
			);
			setIsLoading(false);
		},
	});

	const onSubmit = async (data: TAddressSchema) => {
		setIsLoading(true);
		setErrorMessage("");
		createAddressMutation.mutate({ ...data, type: addressType });
	};

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className="text-blue-950 sm:max-w-[425px]">
				<DialogHeader>
					<DialogTitle>Add New {addressType} Address</DialogTitle>
				</DialogHeader>
				<form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
					{errorMessage && (
						<Alert variant="destructive">
							<AlertCircle className="h-4 w-4" />
							<AlertDescription>{errorMessage}</AlertDescription>
						</Alert>
					)}
					<div className="space-y-2">
						<Label htmlFor="name">Name</Label>
						<Input id="name" {...register("name")} disabled={isLoading} />
						{errors.name && (
							<p className="text-red-600 text-sm">{errors.name.message}</p>
						)}
					</div>
					<div className="space-y-2">
						<Label htmlFor="addressLine">Address Line</Label>
						<Input
							id="addressLine"
							{...register("addressLine")}
							disabled={isLoading}
						/>
						{errors.addressLine && (
							<p className="text-red-600 text-sm">
								{errors.addressLine.message}
							</p>
						)}
					</div>
					<div className="space-y-2">
						<Label htmlFor="city">City</Label>
						<Input id="city" {...register("city")} disabled={isLoading} />
						{errors.city && (
							<p className="text-red-600 text-sm">{errors.city.message}</p>
						)}
					</div>
					<div className="space-y-2">
						<Label htmlFor="state">State</Label>
						<Input id="state" {...register("state")} disabled={isLoading} />
						{errors.state && (
							<p className="text-red-600 text-sm">{errors.state.message}</p>
						)}
					</div>
					<div className="space-y-2">
						<Label htmlFor="zipCode">Zip Code</Label>
						<Input
							id="zipCode"
							type="number"
							{...register("zipCode", { valueAsNumber: true })}
							disabled={isLoading}
						/>
						{errors.zipCode && (
							<p className="text-red-600 text-sm">{errors.zipCode.message}</p>
						)}
					</div>
					<DialogFooter>
						<Button type="submit" disabled={isLoading}>
							{isLoading ? "Adding..." : "Add Address"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
