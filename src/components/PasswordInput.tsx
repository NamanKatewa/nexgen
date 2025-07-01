"use client";

import { Eye, EyeOff } from "lucide-react";
import React, { useState } from "react";
import { FieldError } from "~/components/FieldError";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";

interface PasswordInputProps
	extends React.InputHTMLAttributes<HTMLInputElement> {
	label?: string;
	id: string;
	error?: string;
}

const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
	({ label, id, error, ...props }, ref) => {
		const [showPassword, setShowPassword] = useState(false);

		return (
			<div className="space-y-2">
				{label && <Label htmlFor={id}>{label}</Label>}
				<div className="relative">
					<Input
						id={id}
						type={showPassword ? "text" : "password"}
						ref={ref}
						className="pr-10"
						autoComplete="current-password"
						aria-invalid={!!error}
						{...props}
					/>
					<button
						type="button"
						onClick={() => setShowPassword((prev) => !prev)}
						className="absolute inset-y-0 right-0 flex items-center pr-3 text-blue-950"
						tabIndex={-1}
					>
						{showPassword ? (
							<EyeOff className="h-4 w-4" />
						) : (
							<Eye className="h-4 w-4" />
						)}
					</button>
				</div>
				<FieldError message={error} />
			</div>
		);
	},
);

PasswordInput.displayName = "PasswordInput";

export { PasswordInput };
