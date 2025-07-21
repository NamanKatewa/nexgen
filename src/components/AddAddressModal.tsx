import { zodResolver } from "@hookform/resolvers/zod";
import type { ADDRESS_TYPE } from "@prisma/client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { FieldError } from "~/components/FieldError";
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
			if (addressType === "Warehouse") {
				toast.success("Address added successfully! Wait for admin Approval");
			} else {
				toast.success("Address added successfully!");
			}
			onAddressAdded();
			reset();
			onClose();
		},
		onError: (error) => {
			toast.error(error.message || "Something went wrong. Please try again.");
			setIsLoading(false);
		},
	});

	const onSubmit = async (data: TAddressSchema) => {
		setIsLoading(true);
		createAddressMutation.mutate({ ...data, type: addressType });
	};

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className="text-blue-950 sm:max-w-[425px]">
				<DialogHeader>
					<DialogTitle>Add New {addressType} Address</DialogTitle>
				</DialogHeader>
				<form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
					<div className="space-y-2">
						<Label htmlFor="name">Name</Label>
						<Input id="name" {...register("name")} disabled={isLoading} />
						<FieldError message={errors.name?.message} />
					</div>
					<div className="space-y-2">
						<Label htmlFor="addressLine">Address Line</Label>
						<Input
							id="addressLine"
							{...register("addressLine")}
							disabled={isLoading}
						/>
						<FieldError message={errors.addressLine?.message} />
					</div>
					<div className="space-y-2">
						<Label htmlFor="landmark">Landmark (Optional)</Label>
						<Input
							id="landmark"
							{...register("landmark")}
							disabled={isLoading}
						/>
						<FieldError message={errors.landmark?.message} />
					</div>
					<div className="space-y-2">
						<Label htmlFor="city">City</Label>
						<Input id="city" {...register("city")} disabled={isLoading} />
						<FieldError message={errors.city?.message} />
					</div>
					<div className="space-y-2">
						<Label htmlFor="state">State</Label>
						<Input id="state" {...register("state")} disabled={isLoading} />
						<FieldError message={errors.state?.message} />
					</div>
					<div className="space-y-2">
						<Label htmlFor="zipCode">Zip Code</Label>
						<Input
							id="zipCode"
							type="number"
							{...register("zipCode", { valueAsNumber: true })}
							disabled={isLoading}
						/>
						<FieldError message={errors.zipCode?.message} />
					</div>
					<DialogFooter>
						<Button type="submit" disabled={createAddressMutation.isPending}>
							{createAddressMutation.isPending ? "Adding..." : "Add Address"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
