"use client";

import { AlertCircle } from "lucide-react";
import type React from "react";
import { Alert, AlertDescription } from "~/components/ui/alert";
import {
	Card,
	CardContent,
	CardFooter,
	CardHeader,
} from "~/components/ui/card";

interface FormWrapperProps {
	title: string;
	description?: string;
	errorMessage?: string;
	footerText?: React.ReactNode;
	children: React.ReactNode;
	cardClassName?: string;
	headerClassName?: string;
	contentClassName?: string;
	footerClassName?: string;
}

const FormWrapper: React.FC<FormWrapperProps> = ({
	title,
	description,
	errorMessage,
	footerText,
	children,
	cardClassName,
	headerClassName,
	contentClassName,
	footerClassName,
}) => {
	return (
		<Card className={cardClassName}>
			<CardHeader className={headerClassName}>
				<h1 className="text-center font-semibold text-2xl text-blue-950 tracking-tight">
					{title}
				</h1>
				{description && (
					<p className="text-center text-blue-900 text-sm">{description}</p>
				)}
			</CardHeader>
			<CardContent className={contentClassName}>
				{errorMessage && (
					<Alert variant="destructive" className="mb-4">
						<AlertCircle className="h-4 w-4" />
						<AlertDescription>{errorMessage}</AlertDescription>
					</Alert>
				)}
				{children}
			</CardContent>
			{footerText && (
				<CardFooter className={footerClassName}>{footerText}</CardFooter>
			)}
		</Card>
	);
};

export { FormWrapper };
