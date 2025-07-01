"use client";

import { CheckCircle } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { Button } from "~/components/ui/button";
import { api } from "~/trpc/react";

export default function WalletCallbackClient() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const transaction_id = searchParams.get("id");
	const utils = api.useUtils();

	const {
		mutate: confirmTransaction,
		isPending,
		isSuccess,
		error,
	} = api.wallet.updateTransaction.useMutation({
		onSuccess: () => utils.auth.me.invalidate(),
		onError: (error) => {
			console.error(error);
		},
	});

	useEffect(() => {
		if (transaction_id) {
			confirmTransaction({ transaction_id });
		}
	}, [transaction_id, confirmTransaction]);

	if (!transaction_id)
		return (
			<div className="flex min-h-screen flex-col items-center justify-center px-4">
				You seem lost
			</div>
		);

	return (
		<div className="flex min-h-screen flex-col items-center justify-center px-4">
			<CheckCircle className="mb-4 h-16 w-16 text-green-500" />
			<h1 className="mb-2 font-semibold text-2xl text-blue-900">
				Payment Successful!
			</h1>
			<p className="mb-6 max-w-md text-center text-slate-600">
				{isPending
					? "Confirming your transaction..."
					: isSuccess
						? "Your payment has been confirmed."
						: error
							? error.message
							: "Your payment has been received. Please wait while the admin confirms your transaction."}
			</p>

			<Button
				onClick={() => router.push("/dashboard")}
				className="bg-blue-500 hover:bg-blue-600"
			>
				Go to Dashboard
			</Button>
		</div>
	);
}
