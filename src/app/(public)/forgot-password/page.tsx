"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { MailCheck } from "lucide-react";
import { nanoid } from "nanoid";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { FormWrapper } from "~/components/FormWrapper";
import { PasswordInput } from "~/components/PasswordInput";
import { Alert, AlertDescription } from "~/components/ui/alert";
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
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
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
      setMessage("OTP sent to your email.");
      setStep("reset");
      setResendTimer(60);
    },
    onError: (error) => {
      setErrorMessage(error.message);
    },
  });

  const resetPassword = api.auth.resetPasswordWithOtp.useMutation({
    onSuccess: () => {
      setMessage("Password reset successful. Redirecting to login...");
    },
    onError: (error) => {
      setErrorMessage(error.message);
    },
  });

  useEffect(() => {
    if (resetPassword.isSuccess) {
      const timeout = setTimeout(() => {
        router.push("/login");
      }, 5000);
      return () => clearTimeout(timeout);
    }
  }, [resetPassword.isSuccess, router]);

  const handleEmailSubmit = (data: TForgotPasswordSchema) => {
    setEmail(data.email);
    setErrorMessage("");
    setMessage("");
    forgotPassword.mutate(data);
  };

  const handleResetSubmit = (data: TResetPasswordWithOtpSchema) => {
    setErrorMessage("");
    setMessage("");
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
        errorMessage={errorMessage}
        cardClassName="w-[500px] bg-blue-100/20"
      >
        {message && (
          <Alert variant="default" className="mb-4 bg-green-300">
            <MailCheck className="h-4 w-4" />
            <AlertDescription className="text-blue-950">
              {message}
            </AlertDescription>
          </Alert>
        )}

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
              {emailForm.formState.errors.email && (
                <p className="mt-1 text-red-600 text-sm">
                  {emailForm.formState.errors.email.message}
                </p>
              )}
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
              {resetForm.formState.errors.otp && (
                <p className="mt-1 text-red-600 text-sm">
                  {resetForm.formState.errors.otp.message}
                </p>
              )}
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
