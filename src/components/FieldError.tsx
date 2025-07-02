import type React from "react";
import { cn } from "~/lib/utils";

interface FieldErrorProps {
	message?: string;
	className?: string;
}

const FieldError: React.FC<FieldErrorProps> = ({ message, className }) => {
	return (
		<p className={cn("mt-1 text-red-600 text-sm", className)}>
			{message || "\u00A0"}
		</p>
	);
};

export { FieldError };
