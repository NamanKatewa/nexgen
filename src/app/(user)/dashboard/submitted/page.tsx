"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardFooter,
} from "~/components/ui/card";

import { Button } from "~/components/ui/button";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { api } from "~/trpc/react";

export default function SubmittedPage() {
  const router = useRouter();
  const utils = api.useUtils();

  const handleLogout = () => {
    localStorage.removeItem("token");

    // Immediately expire the cookie
    document.cookie =
      "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax; Secure";

    // Invalidate cached auth info
    utils.auth.me.invalidate();

    // Navigate to home
    router.push("/");
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-blue-50">
      <Card className="w-full max-w-md bg-blue-100/20 shadow-md">
        <CardHeader>
          <h1 className="text-2xl font-semibold text-center text-blue-950">
            KYC Submitted – Pending Verification
          </h1>
        </CardHeader>
        <CardContent>
          <p className="text-center text-base text-blue-950">
            Your KYC details have been successfully submitted and are currently
            under review. This process typically takes a short while.
            <br />
            <br />
            For the most accurate status, consider logging out and logging in
            again.
          </p>
        </CardContent>
        <CardFooter className="flex flex-col gap-2 items-center justify-center">
          <Button
            onClick={handleLogout}
            className="w-full max-w-xs bg-red-400 hover:bg-red-500 text-blue-950 transition-colors"
            variant="outline"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
          <p className="text-sm text-blue-950">Thank you for your patience!</p>
        </CardFooter>
      </Card>
    </div>
  );
}
