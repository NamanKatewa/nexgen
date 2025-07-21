"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import type { ENTITY_TYPE } from "@prisma/client";
import { nanoid } from "nanoid";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
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
import { Progress } from "~/components/ui/progress";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "~/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { type TKycSchema, submitKycSchema } from "~/schemas/kyc";
import { api } from "~/trpc/react";

export default function KycFormPage() {
	const router = useRouter();
	const [isLoading, setIsLoading] = useState(false);
	const [currentStep, setCurrentStep] = useState(0);

	const [aadharFrontPreview, setAadharFrontPreview] = useState<string | null>(
		null,
	);
	const [aadharBackPreview, setAadharBackPreview] = useState<string | null>(
		null,
	);
	const [panFrontPreview, setPanFrontPreview] = useState<string | null>(null);

	const kycSubmitMutation = api.kyc.kycSubmit.useMutation({
		onSuccess: () => {
			setIsLoading(false);
			toast.success("KYC details updated successfully! Redirecting...");
			setTimeout(() => {
				router.push("/dashboard/submitted");
				router.refresh();
			}, 2000);
		},
		onError(error) {
			toast.error(error.message);
			setIsLoading(false);
		},
	});

	const {
		register,
		handleSubmit,
		setValue,
		watch,
		trigger,
		clearErrors,
		formState: { errors },
	} = useForm<TKycSchema>({
		resolver: zodResolver(submitKycSchema),
		defaultValues: {
			gst: false,
			submission_date: new Date(),
		},
		mode: "onTouched", // Add this line to enable real-time validation on blur
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
				clearErrors(fieldName); // Clear error for this field
			} catch (error) {
				console.error("Error converting file to Base64:", error);
				toast.error("Failed to process image file");
				setValue(fieldName, undefined);
				setPreview(null);
			} finally {
				// Ensure errors are cleared even if there's an issue with file processing
				clearErrors(fieldName);
			}
		} else {
			setValue(fieldName, undefined);
			setPreview(null);
			clearErrors(fieldName); // Clear error if file is unselected
		}
	};

	const onSubmit = async (data: TKycSchema) => {
		setIsLoading(true);
		kycSubmitMutation.mutate(data);
	};

	const handleNext = async () => {
		let isValid = false;
		if (currentStep === 0) {
			isValid = await trigger(["entityName", "entityType", "websiteUrl"]);
		} else if (currentStep === 1) {
			isValid = await trigger([
				"billingAddress.zipCode",
				"billingAddress.city",
				"billingAddress.state",
				"billingAddress.addressLine",
				"billingAddress.landmark",
			]);
		} else if (currentStep === 2) {
			isValid = await trigger([
				"aadharNumber",
				"aadharImageFront",
				"aadharImageBack",
				"panNumber",
				"panImageFront",
			]);
		}

		if (isValid) {
			setCurrentStep((prev) => prev + 1);
		}
	};

	const handlePrevious = () => {
		setCurrentStep((prev) => prev - 1);
	};

	const steps = [
		"Entity Details",
		"Address Details",
		"Document Uploads",
		"Review & Submit",
	];

	const progressValue = ((currentStep + 1) / steps.length) * 100;

	return (
		<div className="flex min-h-screen items-center justify-center p-4">
			<Card className="w-full max-w-3xl bg-blue-100/20">
				<CardHeader>
					<h1 className="text-center font-semibold text-2xl text-blue-950">
						KYC Form
					</h1>
					<p className="text-center text-blue-900 text-sm">
						Enter your business verification details
					</p>
					<Progress value={progressValue} className="mt-4 w-full" />
				</CardHeader>
				<CardContent>
					<form
						onSubmit={handleSubmit(onSubmit)}
						className="space-y-6 text-blue-950"
					>
						<Tabs
							value={currentStep.toString()}
							onValueChange={(value) => setCurrentStep(Number.parseInt(value))}
							className="w-full"
						>
							<TabsList className="grid w-full grid-cols-4">
								{steps.map((stepName, index) => (
									<TabsTrigger
										key={stepName}
										value={index.toString()}
										disabled={index > currentStep}
									>
										{stepName}
									</TabsTrigger>
								))}
							</TabsList>

							<TabsContent value="0" className="pt-6">
								<div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
									<div className="space-y-2">
										<Label htmlFor="entityName">Entity Name</Label>
										<Input
											id="entityName"
											{...register("entityName", {
												onChange: () => clearErrors("entityName"),
											})}
											disabled={isLoading}
										/>
										<FieldError message={errors.entityName?.message} />
									</div>

									<div className="space-y-2">
										<Label htmlFor="entityType">Entity Type</Label>
										<Select
											onValueChange={(val) => {
												setValue("entityType", val as ENTITY_TYPE);
												clearErrors("entityType");
											}}
											disabled={isLoading}
											value={watch("entityType")}
										>
											<SelectTrigger id="entityType">
												<SelectValue placeholder="Select entity type" />
											</SelectTrigger>
											<SelectContent>
												{[
													{ label: "Individual", value: "Individual" },
													{
														label: "Self Employment",
														value: "SelfEmployement",
													},
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
													{
														label: "Partnership Firm",
														value: "PartnershipFirm",
													},
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
										<Label htmlFor="websiteUrl">Website URL (optional)</Label>
										<Input
											id="websiteUrl"
											{...register("websiteUrl", {
												onChange: () => clearErrors("websiteUrl"),
											})}
											disabled={isLoading}
										/>
										<FieldError message={errors.websiteUrl?.message} />
									</div>
								</div>
							</TabsContent>

							<TabsContent value="1" className="pt-6">
								<div className="space-y-4">
									<Label>Billing Address</Label>
									<div className="grid grid-cols-1 gap-6 md:grid-cols-2">
										<div className="space-y-2">
											<Label htmlFor="billingAddress.zipCode">Zip Code</Label>
											<Input
												id="billingAddress.zipCode"
												placeholder="Zip Code"
												type="number"
												{...register("billingAddress.zipCode", {
													valueAsNumber: true,
													onChange: () => clearErrors("billingAddress.zipCode"),
												})}
											/>
											<FieldError
												message={errors.billingAddress?.zipCode?.message}
											/>
										</div>
										<div className="space-y-2">
											<Label htmlFor="billingAddress.city">City</Label>
											<Input
												id="billingAddress.city"
												placeholder="City"
												{...register("billingAddress.city", {
													onChange: () => clearErrors("billingAddress.city"),
												})}
											/>
											<FieldError
												message={errors.billingAddress?.city?.message}
											/>
										</div>
										<div className="space-y-2">
											<Label htmlFor="billingAddress.state">State</Label>
											<Input
												id="billingAddress.state"
												placeholder="State"
												{...register("billingAddress.state", {
													onChange: () => clearErrors("billingAddress.state"),
												})}
											/>
											<FieldError
												message={errors.billingAddress?.state?.message}
											/>
										</div>
										<div className="space-y-2 md:col-span-2">
											<Label htmlFor="billingAddress.addressLine">
												Address Line
											</Label>
											<Input
												id="billingAddress.addressLine"
												placeholder="Address Line"
												{...register("billingAddress.addressLine", {
													onChange: () =>
														clearErrors("billingAddress.addressLine"),
												})}
											/>
											<FieldError
												message={errors.billingAddress?.addressLine?.message}
											/>
										</div>
										<div className="space-y-2 md:col-span-2">
											<Label htmlFor="billingAddress.landmark">
												Landmark (Optional)
											</Label>
											<Input
												id="billingAddress.landmark"
												placeholder="Landmark"
												{...register("billingAddress.landmark", {
													onChange: () =>
														clearErrors("billingAddress.landmark"),
												})}
											/>
											<FieldError
												message={errors.billingAddress?.landmark?.message}
											/>
										</div>
									</div>
								</div>
							</TabsContent>

							<TabsContent value="2" className="pt-6">
								<div className="grid grid-cols-1 gap-6 md:grid-cols-2">
									<div className="space-y-2 md:col-span-2">
										<Label htmlFor="aadharNumber">Aadhar Number</Label>
										<InputOTP
											id="aadharNumber"
											maxLength={12}
											value={watch("aadharNumber")}
											onChange={(val) => {
												setValue("aadharNumber", val);
												clearErrors("aadharNumber");
											}}
											disabled={isLoading}
											pattern="\d*"
											inputMode="numeric"
										>
											<InputOTPGroup>
												{[0, 1, 2, 3].map((i) => (
													<InputOTPSlot key={nanoid()} index={i} />
												))}
											</InputOTPGroup>
											<span className="px-2">-</span>
											<InputOTPGroup>
												{[4, 5, 6, 7].map((i) => (
													<InputOTPSlot key={nanoid()} index={i} />
												))}
											</InputOTPGroup>
											<span className="px-2">-</span>
											<InputOTPGroup>
												{[8, 9, 10, 11].map((i) => (
													<InputOTPSlot key={nanoid()} index={i} />
												))}
											</InputOTPGroup>
										</InputOTP>
										<FieldError message={errors.aadharNumber?.message} />
									</div>

									<div className="space-y-2">
										<Label htmlFor="aadharImageFront">Aadhar Front Image</Label>
										<Input
											id="aadharImageFront"
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
										<div className="mt-2 flex h-32 w-32 items-center justify-center overflow-hidden rounded border bg-gray-100">
											{aadharFrontPreview && (
												<img
													src={aadharFrontPreview}
													alt="Aadhar Front Preview"
													className="h-full w-full object-cover"
												/>
											)}
										</div>
										<FieldError
											message={errors.aadharImageFront?.message as string}
										/>
									</div>

									<div className="space-y-2">
										<Label htmlFor="aadharImageBack">Aadhar Back Image</Label>
										<Input
											id="aadharImageBack"
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
										<div className="mt-2 flex h-32 w-32 items-center justify-center overflow-hidden rounded border bg-gray-100">
											{aadharBackPreview && (
												<img
													src={aadharBackPreview}
													alt="Aadhar Back Preview"
													className="h-full w-full object-cover"
												/>
											)}
										</div>
										<FieldError
											message={errors.aadharImageBack?.message as string}
										/>
									</div>

									<div className="space-y-2 md:col-span-2">
										<Label htmlFor="panNumber">PAN Number</Label>
										<InputOTP
											id="panNumber"
											maxLength={10}
											value={watch("panNumber")}
											onChange={(val) => {
												setValue("panNumber", val.toUpperCase());
												clearErrors("panNumber");
											}}
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
										<Label htmlFor="panImageFront">PAN Front Image</Label>
										<Input
											id="panImageFront"
											type="file"
											accept="image/*"
											onChange={(e) => {
												handleFileChange(
													e,
													"panImageFront",
													setPanFrontPreview,
												);
											}}
										/>
										<div className="mt-2 flex h-32 w-32 items-center justify-center overflow-hidden rounded border bg-gray-100">
											{panFrontPreview && (
												<img
													src={panFrontPreview}
													alt="PAN Front Preview"
													className="h-full w-full object-cover"
												/>
											)}
										</div>
										<FieldError
											message={errors.panImageFront?.message as string}
										/>
									</div>
								</div>
							</TabsContent>

							<TabsContent value="3" className="pt-6">
								<div className="space-y-6">
									<h2 className="font-semibold text-blue-950 text-xl">
										Review Your Details
									</h2>

									<div className="grid grid-cols-1 gap-6 md:grid-cols-2">
										<div className="space-y-2 rounded-md border bg-white/50 p-4">
											<h3 className="font-medium text-blue-950 text-lg">
												Entity Details
											</h3>
											<div className="grid grid-cols-2 gap-2">
												<p className="col-span-1">
													<strong className="text-blue-950">
														Entity Name:
													</strong>
												</p>
												<p className="col-span-1">{watch("entityName")}</p>
												<p className="col-span-1">
													<strong className="text-blue-950">
														Entity Type:
													</strong>
												</p>
												<p className="col-span-1">{watch("entityType")}</p>
												<p className="col-span-1">
													<strong className="text-blue-950">
														Website URL:
													</strong>
												</p>
												<p className="col-span-1">{watch("websiteUrl")}</p>
											</div>
										</div>

										<div className="space-y-2 rounded-md border bg-white/50 p-4">
											<h3 className="font-medium text-blue-950 text-lg">
												Billing Address
											</h3>
											<div className="grid grid-cols-2 gap-2">
												<p className="col-span-1">
													<strong className="text-blue-950">
														Address Line:
													</strong>
												</p>
												<p className="col-span-1">
													{watch("billingAddress.addressLine")}
												</p>
												{watch("billingAddress.landmark") && (
													<p className="col-span-1">
														<strong className="text-blue-950">Landmark:</strong>
													</p>
												)}
												{watch("billingAddress.landmark") && (
													<p className="col-span-1">
														{watch("billingAddress.landmark")}
													</p>
												)}
												{watch("billingAddress.landmark") && (
													<p className="col-span-1">
														<strong className="text-blue-950">Landmark:</strong>
													</p>
												)}
												{watch("billingAddress.landmark") && (
													<p className="col-span-1">
														{watch("billingAddress.landmark")}
													</p>
												)}
												<p className="col-span-1">
													<strong className="text-blue-950">City:</strong>
												</p>
												<p className="col-span-1">
													{watch("billingAddress.city")}
												</p>
												<p className="col-span-1">
													<strong className="text-blue-950">State:</strong>
												</p>
												<p className="col-span-1">
													{watch("billingAddress.state")}
												</p>
												<p className="col-span-1">
													<strong className="text-blue-950">Zip Code:</strong>
												</p>
												<p className="col-span-1">
													{watch("billingAddress.zipCode")}
												</p>
											</div>
										</div>

										<div className="space-y-2 rounded-md border bg-white/50 p-4">
											<h3 className="font-medium text-blue-950 text-lg">
												Aadhar Details
											</h3>
											<div className="grid grid-cols-2 gap-2">
												<p className="col-span-1">
													<strong className="text-blue-950">
														Aadhar Number:
													</strong>
												</p>
												<p className="col-span-1">{watch("aadharNumber")}</p>
												{aadharFrontPreview && (
													<p className="col-span-1">
														<strong className="text-blue-950">
															Aadhar Front:
														</strong>
													</p>
												)}
												{aadharFrontPreview && (
													<p className="col-span-1">
														<img
															src={aadharFrontPreview}
															alt="Aadhar Front"
															className="inline-block h-20 w-20 object-cover"
														/>
													</p>
												)}
												{aadharBackPreview && (
													<p className="col-span-1">
														<strong className="text-blue-950">
															Aadhar Back:
														</strong>
													</p>
												)}
												{aadharBackPreview && (
													<p className="col-span-1">
														<img
															src={aadharBackPreview}
															alt="Aadhar Back"
															className="inline-block h-20 w-20 object-cover"
														/>
													</p>
												)}
											</div>
										</div>

										<div className="space-y-2 rounded-md border bg-white/50 p-4">
											<h3 className="font-medium text-blue-950 text-lg">
												PAN Details
											</h3>
											<div className="grid grid-cols-2 gap-2">
												<p className="col-span-1">
													<strong className="text-blue-950">PAN Number:</strong>
												</p>
												<p className="col-span-1">{watch("panNumber")}</p>
												{panFrontPreview && (
													<p className="col-span-1">
														<strong className="text-blue-950">
															PAN Front:
														</strong>
													</p>
												)}
												{panFrontPreview && (
													<p className="col-span-1">
														<img
															src={panFrontPreview}
															alt="PAN Front"
															className="inline-block h-20 w-20 object-cover"
														/>
													</p>
												)}
											</div>
										</div>
									</div>

									<div className="mt-4 flex items-center space-x-2">
										<input
											type="checkbox"
											{...register("gst")}
											className="h-4 w-4 bg-blue-950 text-amber-100"
										/>
										<Label htmlFor="gst">Do you have GST?</Label>
									</div>
								</div>
							</TabsContent>
						</Tabs>

						<div className="mt-4 flex justify-between">
							<Button
								type="button"
								onClick={handlePrevious}
								disabled={isLoading || currentStep === 0}
								className={currentStep === 0 ? "invisible" : ""}
							>
								Previous
							</Button>
							{currentStep < steps.length - 1 ? (
								<Button type="button" onClick={handleNext} disabled={isLoading}>
									Next
								</Button>
							) : (
								<Button
									type="button"
									onClick={handleSubmit(onSubmit)}
									disabled={isLoading || kycSubmitMutation.isPending}
								>
									{isLoading || kycSubmitMutation.isPending
										? "Submitting..."
										: "Submit KYC"}
								</Button>
							)}
						</div>
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
