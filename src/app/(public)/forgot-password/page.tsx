"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, MailCheck } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Alert, AlertDescription } from "~/components/ui/alert";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardFooter,
} from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  forgotPasswordSchema,
  type TForgotPasswordSchema,
} from "~/schemas/auth";
import { api } from "~/trpc/react";

export default function SubmittedPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [message, setMessage] = useState("");
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TForgotPasswordSchema>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const forgotPasswordMutation = api.auth.forgotPassword.useMutation({
    onSuccess: async () => {
      setMessage("Password Reset Email Sent");
      setIsLoading(false);
    },
    onError: (error) => {
      setErrorMessage(error.message || "An error occured during sending email");
      setIsLoading(false);
    },
  });

  const onSubmit = (data: TForgotPasswordSchema) => {
    setIsLoading(true);
    setErrorMessage("");
    setMessage("");
    forgotPasswordMutation.mutate(data);
  };
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-[500] bg-blue-100/20">
        <CardHeader>
          <h1 className="text-2xl font-semibold text-center text-blue-950">
            Forgot Password
          </h1>
        </CardHeader>
        <CardContent>
          <form
            noValidate
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-4 text-blue-950"
          >
            {errorMessage && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
            )}
            {message && (
              <>
                <Alert variant="default" className="bg-yellow-200">
                  <MailCheck className="h-4 w-4" />
                  <AlertDescription className=" text-blue-950">
                    Logged out of current session
                  </AlertDescription>
                </Alert>
                <Alert variant="default" className="bg-green-300">
                  <MailCheck className="h-4 w-4" />
                  <AlertDescription className=" text-blue-950">
                    {message}
                  </AlertDescription>
                </Alert>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                {...register("email")}
                disabled={isLoading}
              />
              {errors.email && (
                <p className="text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading || forgotPasswordMutation.isPending}
            >
              {isLoading || forgotPasswordMutation.isPending
                ? "Sending Reset Email..."
                : "Send Reset Email"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col gap-2 items-center justify-center"></CardFooter>
      </Card>
    </div>
  );
}
