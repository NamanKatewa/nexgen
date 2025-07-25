"use client";

import type React from "react";
import {
	Card,
	CardContent,
	CardFooter,
	CardHeader,
} from "~/components/ui/card";

interface FormWrapperProps {
	title: string;
	description?: string;
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
			<CardContent className={contentClassName}>{children}</CardContent>
			{footerText && (
				<CardFooter className={footerClassName}>{footerText}</CardFooter>
			)}
		</Card>
	);
};

export { FormWrapper };
