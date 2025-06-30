import React from "react";
import { Card, CardContent } from "~/components/ui/card";

const Inactive = () => {
	return (
		<div className="flex h-screen flex-col items-center justify-center">
			<Card className="w-full max-w-[500px] bg-amber-100/20 p-6 shadow-lg backdrop-blur-md md:p-8">
				<CardContent className="flex flex-col gap-10 text-center">
					<h1 className="text-xl">Account Inactive</h1>
					<h1 className="text-xl">Contact Admin to activate your account</h1>
				</CardContent>
			</Card>
		</div>
	);
};

export default Inactive;
