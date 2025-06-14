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

export default function SubmittedPage() {
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem("token");
    document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    router.refresh();
    router.push("/");
  };
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-[500] bg-blue-100/20">
        <CardHeader>
          <h1 className="text-2xl font-semibold text-center text-blue-950">
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
        <CardFooter className="flex flex-col gap-2 items-center justify-center">
          <Button
            onClick={handleLogout}
            className="w-full max-w-xs bg-red-400 hover:bg-red-500 transition-colors text-blue-950"
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
