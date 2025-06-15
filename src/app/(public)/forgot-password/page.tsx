"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, MailCheck, Eye, EyeOff } from "lucide-react";
import { useForm } from "react-hook-form";
import { Alert, AlertDescription } from "~/components/ui/alert";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  forgotPasswordSchema,
  resetPasswordWithOtpSchema,
  type TForgotPasswordSchema,
  type TResetPasswordWithOtpSchema,
} from "~/schemas/auth";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "~/trpc/react";

export default function ResetPage() {
  const router = useRouter();
  const [step, setStep] = useState<"email" | "reset">("email");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [resendTimer, setResendTimer] = useState(60);
  const [showPassword, setShowPassword] = useState(false);

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
    onError: (err) => setErrorMessage(err.message),
  });

  const resetPassword = api.auth.resetPasswordWithOtp.useMutation({
    onSuccess: () => {
      setMessage("Password reset successful. Redirecting to login...");
    },
    onError: (err) => setErrorMessage(err.message),
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
      <Card className="w-[500px] bg-blue-100/20">
        <CardHeader>
          <h1 className="text-2xl font-semibold text-center text-blue-950">
            Forgot Password
          </h1>
        </CardHeader>
        <CardContent>
          {errorMessage && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}
          {message && (
            <Alert variant="default" className="bg-green-300 mb-4">
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
              <Label>Email</Label>
              <Input type="email" {...emailForm.register("email")} />
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
              <Label>OTP</Label>
              <Input maxLength={6} {...resetForm.register("otp")} />
              <Label>New Password</Label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  {...resetForm.register("password")}
                  className="pr-10"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-blue-950"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
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
        </CardContent>
      </Card>
    </div>
  );
}
