"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle } from "lucide-react";
import { Button } from "~/components/ui/button";
import { api } from "~/trpc/react";

export default function WalletCallbackClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const transaction_id = searchParams.get("id");

  const {
    mutate: confirmTransaction,
    isPending,
    isSuccess,
    error,
  } = api.wallet.updateTransaction.useMutation();

  useEffect(() => {
    if (transaction_id) {
      confirmTransaction({ transaction_id });
    }
  }, [transaction_id]);

  if (!transaction_id)
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4">
        You seem lost
      </div>
    );

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
      <h1 className="text-2xl font-semibold text-blue-900 mb-2">
        Payment Successful!
      </h1>
      <p className="text-center text-slate-600 max-w-md mb-6">
        {isPending
          ? "Confirming your transaction..."
          : isSuccess
          ? "Your payment has been confirmed. Wallet will be updated shortly."
          : error
          ? "There was an issue confirming the payment. Please contact support."
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
