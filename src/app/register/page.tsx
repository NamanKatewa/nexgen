"use client";

import Link from "next/link";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { api } from "~/trpc/react";
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
import {
  Card,
  CardContent,
  CardHeader,
  CardFooter,
} from "~/components/ui/card";
import { Alert, AlertDescription } from "~/components/ui/alert";
import { AlertCircle } from "lucide-react";

import { signupSchema, type TSignupSchema } from "~/schemas/auth";

export default function SignupPage() {
  const [errorMessage, setErrorMessage] = useState("");
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
      if (error.message.includes("already exists")) {
        setErrorMessage("An account with this email already exists.");
      } else {
        setErrorMessage(error.message || "An error occurred during signup.");
      }
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
    signupMutation.mutate(data);
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-[500px] bg-amber-100/20">
        <CardHeader>
          <h1 className="text-2xl font-semibold text-center text-blue-950">
            Create Account
          </h1>
          <p className="text-sm text-center text-blue-900">
            Enter your details to create your account
          </p>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handleSubmit(onSubmit)}
            noValidate
            className="space-y-4 text-blue-950"
          >
            {errorMessage && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                {...register("name")}
                disabled={signupMutation.isPending}
              />
              {errors.name && (
                <p className="text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                {...register("email")}
                disabled={signupMutation.isPending}
              />
              {errors.email && (
                <p className="text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="mobileNumber">Mobile Number</Label>
              <Input
                id="mobileNumber"
                {...register("mobileNumber")}
                maxLength={10}
                disabled={signupMutation.isPending}
              />
              {errors.mobileNumber && (
                <p className="text-sm text-red-600">
                  {errors.mobileNumber.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                {...register("password")}
                disabled={signupMutation.isPending}
              />
              {errors.password && (
                <p className="text-sm text-red-600">
                  {errors.password.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="companyName">Company Name</Label>
              <Input
                id="companyName"
                {...register("companyName")}
                disabled={signupMutation.isPending}
              />
              {errors.companyName && (
                <p className="text-sm text-red-600">
                  {errors.companyName.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="monthlyOrder">Monthly Order Volume</Label>
              <Input
                id="monthlyOrder"
                {...register("monthlyOrder")}
                disabled={signupMutation.isPending}
              />
              {errors.monthlyOrder && (
                <p className="text-sm text-red-600">
                  {errors.monthlyOrder.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="businessType">Business Type</Label>
              <Select
                onValueChange={(value) =>
                  setValue("businessType", value as any)
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
              {errors.businessType && (
                <p className="text-sm text-red-600">
                  {errors.businessType.message}
                </p>
              )}
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
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
