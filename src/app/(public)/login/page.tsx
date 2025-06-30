"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, Eye, EyeOff } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Alert, AlertDescription } from "~/components/ui/alert";
import { Button } from "~/components/ui/button";
import {
	Card,
	CardContent,
	CardFooter,
	CardHeader,
} from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { api } from "~/trpc/react";

import { type TLoginSchema, loginSchema } from "~/schemas/auth";

const Login = () => {
	const [isLoading, setIsLoading] = useState(false);
	const [showPassword, setShowPassword] = useState(false);
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
			<div className="mt-8 mb-8 p-4 md:mt-12 lg:mt-24">
				<Image src={"/logo.png"} alt="logo" width={150} height={70} />
			</div>

			<Card className="w-full max-w-[400px] bg-blue-100/20 p-6 shadow-lg backdrop-blur-md md:p-8">
				<CardHeader className="space-y-1">
					<h1 className="text-center font-semibold text-2xl text-blue-950 tracking-tight">
						Welcome back
					</h1>
					<p className="text-center text-blue-900 text-sm">
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
								<p className="text-red-600 text-sm">{errors.email.message}</p>
							)}
						</div>

						<div className="space-y-2">
							<div className="flex items-center justify-between">
								<Label htmlFor="password">Password</Label>
								<Link
									href="/forgot-password"
									className="text-primary text-sm hover:underline"
								>
									Forgot password?
								</Link>
							</div>
							<div className="relative">
								<Input
									id="password"
									type={showPassword ? "text" : "password"}
									{...register("password")}
									disabled={isLoading}
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
										<EyeOff className="h-4 w-4" />
									) : (
										<Eye className="h-4 w-4" />
									)}
								</button>
							</div>
							{errors.password && (
								<p className="text-red-600 text-sm">
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
					<p className="text-gray-500 text-sm">
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
