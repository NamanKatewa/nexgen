import { Suspense } from "react";
import WalletCallbackClient from "~/app/(user)/dashboard/wallet/callback/_client";

export default function Page() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
      <WalletCallbackClient />
    </Suspense>
  );
}
