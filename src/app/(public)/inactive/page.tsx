import React from "react";
import { Card, CardContent } from "~/components/ui/card";

const Inactive = () => {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4">
      <Card className="w-full max-w-md bg-blue-100/20 p-6 shadow-lg backdrop-blur-md md:p-8">
        <CardContent className="flex flex-col items-center text-center gap-6">
          <h1 className="text-2xl font-semibold text-blue-900">
            Account Inactive
          </h1>
          <p className="text-base text-blue-800">
            Please contact the administrator to activate your account.
          </p>
        </CardContent>
      </Card>
    </main>
  );
};

export default Inactive;
