"use client";

import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardFooter,
} from "~/components/ui/card";
import { useState } from "react";
import Image from "next/image";
import { api } from "~/trpc/react";
import { Alert, AlertDescription } from "~/components/ui/alert";
import { AlertCircle } from "lucide-react";

import { loginSchema, type TLoginSchema } from "~/schemas/auth";

const Login = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const router = useRouter();
  const utils = api.useUtils();

  const loginMutation = api.auth.login.useMutation({
    onSuccess: async (data) => {
      localStorage.setItem("token", data.token);
      document.cookie = `token=${data.token}; path=/; max-age=604800; SameSite=Strict`;
      await utils.auth.me.invalidate();

      if (data.user.role === "Admin") {
        router.push("/admin/dashboard");
      } else {
        router.push("/dashboard");
      }
      router.refresh();
    },
    onError: (error) => {
      if (error.message.includes("Invalid credentials")) {
        setErrorMessage("Invalid email or password. Please try again.");
      } else if (error.message.includes("User not found")) {
        setErrorMessage("No account found with this email address.");
      } else {
        setErrorMessage(error.message || "An error occurred during login.");
      }
      setIsLoading(false);
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TLoginSchema>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = (data: TLoginSchema) => {
    setIsLoading(true);
    setErrorMessage("");
    loginMutation.mutate(data);
  };

  return (
    <div className="flex h-screen flex-col items-center">
      <div className="mb-8 mt-8 p-4 md:mt-12 lg:mt-24">
        <Image src={"/logo.png"} alt="logo" width={150} height={70} />
      </div>

      <Card className="w-full max-w-[400px] bg-blue-100/20 p-6 shadow-lg backdrop-blur-md md:p-8">
        <CardHeader className="space-y-1">
          <h1 className="text-center text-2xl font-semibold tracking-tight text-blue-950">
            Welcome back
          </h1>
          <p className="text-center text-sm text-blue-900">
            Enter your credentials to login
          </p>
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

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link
                  href="/forgot-password"
                  className="text-sm text-primary hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                {...register("password")}
                disabled={isLoading}
              />
              {errors.password && (
                <p className="text-sm text-red-600">
                  {errors.password.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading || loginMutation.isPending}
            >
              {isLoading || loginMutation.isPending
                ? "Signing in..."
                : "Sign in"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-gray-500">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="text-primary hover:underline">
              Create account
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Login;
