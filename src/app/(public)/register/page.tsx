"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { FieldError } from "~/components/FieldError";
import { FormWrapper } from "~/components/FormWrapper";
import { PasswordInput } from "~/components/PasswordInput";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "~/components/ui/select";
import { api } from "~/trpc/react";

import { type TSignupSchema, signupSchema } from "~/schemas/auth";

export default function SignupPage() {
	const [errorMessage, setErrorMessage] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [confirmPasswordError, setConfirmPasswordError] = useState("");
	const router = useRouter();
	const utils = api.useUtils();

	const signupMutation = api.auth.signup.useMutation({
		onSuccess: async (data) => {
			localStorage.setItem("token", data.token);
			document.cookie = `token=${data.token}; path=/; max-age=604800; SameSite=Strict`;
			await utils.auth.me.invalidate;
			router.push("/dashboard");
			router.refresh();
		},
		onError: (error) => {
			setErrorMessage(error.message);
		},
	});

	const {
		register,
		handleSubmit,
		setValue,
		formState: { errors },
	} = useForm<TSignupSchema>({
		resolver: zodResolver(signupSchema),
	});

	const onSubmit = (data: TSignupSchema) => {
		setErrorMessage("");
		setConfirmPasswordError("");

		if (data.password !== confirmPassword) {
			setConfirmPasswordError("Passwords do not match");
			return;
		}

		signupMutation.mutate(data);
	};

	return (
		<div className="flex min-h-screen items-center justify-center p-4">
			<FormWrapper
				title="Create Account"
				description="Enter your details to create your account"
				errorMessage={errorMessage}
				footerText={
					<p className="text-muted-foreground text-sm">
						Already have an account?{" "}
						<Link href="/login" className="text-primary hover:underline">
							Sign in
						</Link>
					</p>
				}
				cardClassName="w-full max-w-[500px] bg-blue-100/20"
			>
				<form
					onSubmit={handleSubmit(onSubmit)}
					noValidate
					className="space-y-4 text-blue-950"
				>
					<div className="space-y-2">
						<Label htmlFor="name">Name</Label>
						<Input
							id="name"
							{...register("name")}
							disabled={signupMutation.isPending}
						/>
						<FieldError message={errors.name?.message} />
					</div>

					<div className="space-y-2">
						<Label htmlFor="email">Email</Label>
						<Input
							id="email"
							type="email"
							{...register("email")}
							disabled={signupMutation.isPending}
						/>
						<FieldError message={errors.email?.message} />
					</div>

					<div className="space-y-2">
						<Label htmlFor="mobileNumber">Mobile Number</Label>
						<Input
							id="mobileNumber"
							{...register("mobileNumber")}
							maxLength={10}
							disabled={signupMutation.isPending}
						/>
						<FieldError message={errors.mobileNumber?.message} />
					</div>

					<PasswordInput
						id="password"
						label="Password"
						{...register("password")}
						disabled={signupMutation.isPending}
						error={errors.password?.message}
					/>

					<PasswordInput
						id="confirmPassword"
						label="Confirm Password"
						value={confirmPassword}
						onChange={(e) => setConfirmPassword(e.target.value)}
						disabled={signupMutation.isPending}
						error={confirmPasswordError}
					/>

					<div className="space-y-2">
						<Label htmlFor="companyName">Company Name</Label>
						<Input
							id="companyName"
							{...register("companyName")}
							disabled={signupMutation.isPending}
						/>
						<FieldError message={errors.companyName?.message} />
					</div>

					<div className="space-y-2">
						<Label htmlFor="monthlyOrder">Monthly Order Volume</Label>
						<Input
							id="monthlyOrder"
							type="number"
							{...register("monthlyOrder")}
							disabled={signupMutation.isPending}
						/>
						<FieldError message={errors.monthlyOrder?.message} />
					</div>

					<div className="space-y-2">
						<Label htmlFor="businessType">Business Type</Label>
						<Select
							onValueChange={(value: TSignupSchema["businessType"]) =>
								setValue("businessType", value)
							}
							disabled={signupMutation.isPending}
						>
							<SelectTrigger>
								<SelectValue placeholder="Select business type" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="Retailer">Retailer</SelectItem>
								<SelectItem value="Ecommerce">Ecommerce</SelectItem>
								<SelectItem value="Franchise">Franchise</SelectItem>
							</SelectContent>
						</Select>
						<FieldError message={errors.businessType?.message} />
					</div>

					<Button
						type="submit"
						className="w-full"
						disabled={signupMutation.isPending}
					>
						{signupMutation.isPending
							? "Creating account..."
							: "Create account"}
					</Button>
				</form>
			</FormWrapper>
		</div>
	);
}
