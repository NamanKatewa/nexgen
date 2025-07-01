"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import type { ENTITY_TYPE } from "@prisma/client";
import { AlertCircle } from "lucide-react";
import { nanoid } from "nanoid";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
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
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "~/components/ui/select";
import { type TKycSchema, submitKycSchema } from "~/schemas/kyc";
import { api } from "~/trpc/react";

export default function KycFormPage() {
	const router = useRouter();
	const [errorMessage, setErrorMessage] = useState("");
	const [isLoading, setIsLoading] = useState(false);

	const [aadharFrontPreview, setAadharFrontPreview] = useState<string | null>(
		null,
	);
	const [aadharBackPreview, setAadharBackPreview] = useState<string | null>(
		null,
	);
	const [panFrontPreview, setPanFrontPreview] = useState<string | null>(null);
	const [panBackPreview, setPanBackPreview] = useState<string | null>(null);

	const kycSubmitMutation = api.kyc.kycSubmit.useMutation({
		onSuccess: () => {
			setIsLoading(false);
			router.push("/dashboard/submitted");
		},
		onError(error) {
			setErrorMessage(error.message);
			setIsLoading(false);
		},
	});

	const {
		register,
		handleSubmit,
		setValue,
		watch,
		formState: { errors },
	} = useForm<TKycSchema>({
		resolver: zodResolver(submitKycSchema),
		defaultValues: {
			gst: false,
			submission_date: new Date(),
		},
	});

	const fileToBase64 = (file: File): Promise<string> => {
		return new Promise((resolve, reject) => {
			const reader = new FileReader();
			reader.readAsDataURL(file);
			reader.onload = () => resolve(reader.result as string);
			reader.onerror = (error) => reject(error);
		});
	};

	const handleFileChange = async (
		event: React.ChangeEvent<HTMLInputElement>,
		fieldName: keyof TKycSchema,
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
				});
			} catch (error) {
				console.error("Error converting file to Base64:", error);
				setErrorMessage("Failed to process image file");
				setValue(fieldName, undefined);
				setPreview(null);
			}
		} else {
			setValue(fieldName, undefined);
			setPreview(null);
		}
	};

	const onSubmit = async (data: TKycSchema) => {
		setIsLoading(true);
		setErrorMessage("");
		kycSubmitMutation.mutate(data);
	};

	return (
		<div className="flex min-h-screen items-center justify-center p-4">
			<Card className="w-full bg-blue-100/20">
				<CardHeader>
					<h1 className="text-center font-semibold text-2xl text-blue-950">
						KYC Form
					</h1>
					<p className="text-center text-blue-900 text-sm">
						Enter your business verification details
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

						<div className="mb-10 flex gap-10">
							<div className="space-y-2">
								<Label>Entity Name</Label>
								<Input {...register("entityName")} disabled={isLoading} />
								<FieldError message={errors.entityName?.message} />
							</div>

							<div className="space-y-2">
								<Label>Entity Type</Label>
								<Select
									onValueChange={(val) =>
										setValue("entityType", val as ENTITY_TYPE)
									}
									disabled={isLoading}
								>
									<SelectTrigger>
										<SelectValue placeholder="Select entity type" />
									</SelectTrigger>
									<SelectContent>
										{[
											{ label: "Individual", value: "Individual" },
											{ label: "Self Employment", value: "SelfEmployement" },
											{
												label: "Proprietorship Firm",
												value: "ProprietorshipFirm",
											},
											{
												label: "Limited Liability Partnership",
												value: "LimitedLiabilityParternship",
											},
											{
												label: "Private Limited Company",
												value: "PrivateLimitedCompany",
											},
											{
												label: "Public Limited Company",
												value: "PublicLimitedCompany",
											},
											{ label: "Partnership Firm", value: "PartnershipFirm" },
										].map(({ label, value }) => (
											<SelectItem key={value} value={value}>
												{label}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
								<FieldError message={errors.entityType?.message} />
							</div>

							<div className="space-y-2">
								<Label>Website URL (optional)</Label>
								<Input {...register("websiteUrl")} disabled={isLoading} />
								<FieldError message={errors.websiteUrl?.message} />
							</div>
						</div>

						<div className="space-y-2">
							<Label>Billing Address</Label>
							<div className="mb-10 grid grid-cols-2 gap-10">
								<Input
									placeholder="Zip Code"
									type="number"
									{...register("billingAddress.zipCode", {
										valueAsNumber: true,
									})}
								/>
								<Input
									placeholder="City"
									{...register("billingAddress.city")}
								/>
								<Input
									placeholder="State"
									{...register("billingAddress.state")}
								/>
								<Input
									className="col-span-2"
									placeholder="Address Line"
									{...register("billingAddress.addressLine")}
								/>
							</div>
							<FieldError
								message={errors.billingAddress?.addressLine?.message}
							/>
						</div>

						<div className="mb-10 flex flex-wrap gap-10">
							<div className="space-y-2">
								<Label>Aadhar Number</Label>
								<InputOTP
									maxLength={12}
									value={watch("aadharNumber")}
									onChange={(val) => setValue("aadharNumber", val)}
									disabled={isLoading}
									pattern="\d*"
									inputMode="numeric"
								>
									<InputOTPGroup>
										{[0, 1, 2, 3].map((_, i) => (
											<InputOTPSlot key={nanoid()} index={i} />
										))}
									</InputOTPGroup>
									<span className="px-2">-</span>
									<InputOTPGroup>
										{[4, 5, 6, 7].map((_, i) => (
											<InputOTPSlot key={nanoid()} index={i} />
										))}
									</InputOTPGroup>
									<span className="px-2">-</span>
									<InputOTPGroup>
										{[8, 9, 10, 11].map((_, i) => (
											<InputOTPSlot key={nanoid()} index={i} />
										))}
									</InputOTPGroup>
								</InputOTP>
								<FieldError message={errors.aadharNumber?.message} />
							</div>

							<div className="space-y-2">
								<Label>Aadhar Front Image</Label>
								<Input
									type="file"
									accept="image/*"
									onChange={(e) => {
										handleFileChange(
											e,
											"aadharImageFront",
											setAadharFrontPreview,
										);
									}}
								/>
								{aadharFrontPreview && (
									<img
										src={aadharFrontPreview}
										alt="Aadhar Front Preview"
										className="h-32 w-32 rounded border object-cover"
									/>
								)}
								<FieldError
									message={errors.aadharImageFront?.message as string}
								/>
							</div>

							<div className="space-y-2">
								<Label>Aadhar Back Image</Label>
								<Input
									type="file"
									accept="image/*"
									onChange={(e) => {
										handleFileChange(
											e,
											"aadharImageBack",
											setAadharBackPreview,
										);
									}}
								/>
								{aadharBackPreview && (
									<img
										src={aadharBackPreview}
										alt="Aadhar Back Preview"
										className="h-32 w-32 rounded border object-cover"
									/>
								)}
								<FieldError
									message={errors.aadharImageBack?.message as string}
								/>
							</div>
						</div>

						<div className="mb-10 flex flex-wrap gap-10">
							<div className="space-y-2">
								<Label>PAN Number</Label>
								<InputOTP
									maxLength={10}
									value={watch("panNumber")}
									onChange={(val) => setValue("panNumber", val.toUpperCase())}
									disabled={isLoading}
									pattern="[A-Z0-9]*"
									className="uppercase"
								>
									{[...Array(10)].map((_, i) => (
										<InputOTPSlot key={nanoid()} index={i} />
									))}
								</InputOTP>
								<FieldError message={errors.panNumber?.message} />
							</div>

							<div className="space-y-2">
								<Label>PAN Front Image</Label>
								<Input
									type="file"
									accept="image/*"
									onChange={(e) => {
										handleFileChange(e, "panImageFront", setPanFrontPreview);
									}}
								/>
								{panFrontPreview && (
									<img
										src={panFrontPreview}
										alt="PAN Front Preview"
										className="h-32 w-32 rounded border object-cover"
									/>
								)}
								<FieldError message={errors.panImageFront?.message as string} />
							</div>

							<div className="space-y-2">
								<Label>PAN Back Image</Label>
								<Input
									type="file"
									accept="image/*"
									onChange={(e) => {
										handleFileChange(e, "panImageBack", setPanBackPreview);
									}}
								/>
								{panBackPreview && (
									<img
										src={panBackPreview}
										alt="PAN Back Preview"
										className="h-32 w-32 rounded border object-cover"
									/>
								)}
								<FieldError message={errors.panImageBack?.message as string} />
							</div>
						</div>

						<div className="flex items-center space-x-2">
							<input
								type="checkbox"
								{...register("gst")}
								className="h-4 w-4 bg-blue-950 text-amber-100"
							/>
							<Label htmlFor="gst">Do you have GST?</Label>
						</div>

						<Button type="submit" className="w-full" disabled={isLoading}>
							{isLoading || kycSubmitMutation.isPending
								? "Submitting..."
								: "Submit KYC"}
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
