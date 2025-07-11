"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { nanoid } from "nanoid";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { FieldError } from "~/components/FieldError";
import { FormWrapper } from "~/components/FormWrapper";
import { PasswordInput } from "~/components/PasswordInput";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import {
	InputOTP,
	InputOTPGroup,
	InputOTPSlot,
} from "~/components/ui/input-otp";
import { Label } from "~/components/ui/label";
import {
	type TForgotPasswordSchema,
	type TResetPasswordWithOtpSchema,
	forgotPasswordSchema,
	resetPasswordWithOtpSchema,
} from "~/schemas/auth";
import { api } from "~/trpc/react";

export default function ResetPage() {
	const router = useRouter();
	const [step, setStep] = useState<"email" | "reset">("email");
	const [email, setEmail] = useState("");
	const [resendTimer, setResendTimer] = useState(60);

	const emailForm = useForm<TForgotPasswordSchema>({
		resolver: zodResolver(forgotPasswordSchema),
	});

	const resetForm = useForm<TResetPasswordWithOtpSchema>({
		resolver: zodResolver(resetPasswordWithOtpSchema),
		defaultValues: { email, otp: "", password: "" },
	});

	useEffect(() => {
		resetForm.setValue("email", email);
	}, [email, resetForm]);

	useEffect(() => {
		if (step !== "reset" || resendTimer <= 0) return;
		const timer = setInterval(() => setResendTimer((t) => t - 1), 1000);
		return () => clearInterval(timer);
	}, [step, resendTimer]);

	const forgotPassword = api.auth.forgotPassword.useMutation({
		onSuccess: () => {
			toast.success("OTP sent to your email.");
			setStep("reset");
			setResendTimer(60);
		},
		onError: (error) => {
			toast.error(error.message);
		},
	});

	const resetPassword = api.auth.resetPasswordWithOtp.useMutation({
		onSuccess: () => {
			toast.success("Password reset successful. Redirecting to login...");
			setTimeout(() => {
				router.push("/login");
			}, 2000);
		},
		onError: (error) => {
			toast.error(error.message);
		},
	});

	const handleEmailSubmit = (data: TForgotPasswordSchema) => {
		setEmail(data.email);
		forgotPassword.mutate(data);
	};

	const handleResetSubmit = (data: TResetPasswordWithOtpSchema) => {
		resetPassword.mutate(data);
	};

	const resend = () => {
		if (!email || forgotPassword.isPending) return;
		forgotPassword.mutate({ email });
		setResendTimer(60);
	};

	return (
		<div className="flex min-h-screen items-center justify-center p-4">
			<FormWrapper
				title="Forgot Password"
				cardClassName="w-[500px] bg-blue-100/20"
			>
				{step === "email" && (
					<form
						onSubmit={emailForm.handleSubmit(handleEmailSubmit)}
						className="space-y-4 text-blue-950"
					>
						<div>
							<Label>Email</Label>
							<Input
								type="email"
								{...emailForm.register("email")}
								aria-invalid={!!emailForm.formState.errors.email}
							/>
							<FieldError message={emailForm.formState.errors.email?.message} />
						</div>
						<Button
							type="submit"
							className="w-full"
							disabled={forgotPassword.isPending}
						>
							{forgotPassword.isPending ? "Sending..." : "Send OTP"}
						</Button>
					</form>
				)}

				{step === "reset" && (
					<form
						onSubmit={resetForm.handleSubmit(handleResetSubmit)}
						className="space-y-4 text-blue-950"
					>
						<div>
							<Label>OTP</Label>
							<Controller
								control={resetForm.control}
								name="otp"
								render={({ field }) => (
									<InputOTP
										maxLength={6}
										value={field.value}
										onChange={field.onChange}
									>
										<InputOTPGroup>
											{Array.from({ length: 6 }).map((_, index) => (
												<InputOTPSlot key={nanoid()} index={index} />
											))}
										</InputOTPGroup>
									</InputOTP>
								)}
							/>
							<FieldError message={resetForm.formState.errors.otp?.message} />
						</div>

						<PasswordInput
							id="password"
							label="New Password"
							{...resetForm.register("password")}
							error={resetForm.formState.errors.password?.message}
						/>

						<Button
							type="submit"
							className="w-full"
							disabled={resetPassword.isPending}
						>
							{resetPassword.isPending ? "Resetting..." : "Reset Password"}
						</Button>

						<Button
							type="button"
							variant="secondary"
							className="w-full"
							onClick={resend}
							disabled={resendTimer > 0 || forgotPassword.isPending}
						>
							{resendTimer > 0
								? `Resend in ${resendTimer}s`
								: forgotPassword.isPending
									? "Sending..."
									: "Resend OTP"}
						</Button>
					</form>
				)}
			</FormWrapper>
		</div>
	);
}
