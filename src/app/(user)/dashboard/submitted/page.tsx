"use client";

import {
	Card,
	CardContent,
	CardFooter,
	CardHeader,
} from "~/components/ui/card";

import { LogOut } from "lucide-react";
import { Button } from "~/components/ui/button";
import { api } from "~/trpc/react";

export default function SubmittedPage() {
	const logoutMutation = api.auth.logout.useMutation();

	const handleLogout = () => {
		logoutMutation.mutate();
		localStorage.removeItem("token");
		document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
		window.location.href = "/"; // Force a full page reload to clear all state
	};
	return (
		<div className="flex min-h-screen items-center justify-center p-4">
			<Card className="w-[500] bg-blue-100/20">
				<CardHeader>
					<h1 className="text-center font-semibold text-2xl text-blue-950">
						KYC Submitted – Pending Verification
					</h1>
				</CardHeader>
				<CardContent>
					<p className="text-center text-base text-blue-950">
						Your KYC details have been successfully submitted and are currently
						under review. This process typically takes a short while. Please
						check back later for updates.
						<br />
						<br />
						For the most accurate status, consider logging out and logging in
						again.
					</p>
				</CardContent>
				<CardFooter className="flex flex-col items-center justify-center gap-2">
					<Button
						onClick={handleLogout}
						className="w-full max-w-xs bg-red-400 text-blue-950 transition-colors hover:bg-red-500"
						variant="outline"
					>
						<LogOut className="mr-2 h-4 w-4" />
						Logout
					</Button>
					<p className="text-blue-950 text-sm">Thank you for your patience!</p>
				</CardFooter>
			</Card>
		</div>
	);
}
