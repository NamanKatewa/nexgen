"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { FormWrapper } from "~/components/FormWrapper";
import { PasswordInput } from "~/components/PasswordInput";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { api } from "~/trpc/react";

import { FieldError } from "~/components/FieldError";
import { type TLoginSchema, loginSchema } from "~/schemas/auth";

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
			setErrorMessage(error.message);
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

			<FormWrapper
				title="Welcome back"
				description="Enter your credentials to login"
				errorMessage={errorMessage}
				footerText={
					<p className="text-gray-500 text-sm">
						Don&apos;t have an account?{" "}
						<Link href="/register" className="text-primary hover:underline">
							Create account
						</Link>
					</p>
				}
				cardClassName="w-full max-w-[400px] bg-blue-100/20 p-6 shadow-lg backdrop-blur-md md:p-8"
			>
				<form
					noValidate
					onSubmit={handleSubmit(onSubmit)}
					className="space-y-4 text-blue-950"
				>
					<div className="space-y-2">
						<Label htmlFor="email">Email</Label>
						<Input
							id="email"
							type="email"
							placeholder="name@example.com"
							{...register("email")}
							disabled={isLoading}
						/>
						<FieldError message={errors.email?.message} />
					</div>

					<div className="flex items-center justify-between">
						<Label htmlFor="password">Password</Label>
						<Link
							href="/forgot-password"
							className="text-primary text-sm hover:underline"
						>
							Forgot password?
						</Link>
					</div>
					<PasswordInput
						id="password"
						{...register("password")}
						disabled={isLoading}
						error={errors.password?.message}
					/>

					<Button
						type="submit"
						className="w-full"
						disabled={isLoading || loginMutation.isPending}
					>
						{isLoading || loginMutation.isPending ? "Signing in..." : "Sign in"}
					</Button>
				</form>
			</FormWrapper>
		</div>
	);
};

export default Login;
