"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { FieldError } from "~/components/FieldError";
import { FormWrapper } from "~/components/FormWrapper";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { generateAndDownloadLabel } from "~/lib/pdf-generator";
import { api } from "~/trpc/react";

const formSchema = z.object({
	shipmentId: z.string().min(1, "ID cannot be empty"),
});

const LabelMakerPage = () => {
	const [isLoading, setIsLoading] = useState(false);
	const {
		register,
		handleSubmit,
		formState: { errors },
		getValues,
	} = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			shipmentId: "",
		},
	});

	const { mutateAsync: generateLabelMutation } =
		api.label.generateLabel.useMutation();

	const onSubmit = async (values: z.infer<typeof formSchema>) => {
		setIsLoading(true);
		await generateAndDownloadLabel(values.shipmentId, generateLabelMutation);
		setIsLoading(false);
	};

	return (
		<div className="flex h-screen w-full items-center justify-center">
			<FormWrapper
				title="Generate Shipping Label"
				cardClassName="w-full max-w-md"
			>
				<form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
					<div className="space-y-2">
						<Label htmlFor="shipmentId">AWB/Shipment/Human-Readable ID</Label>
						<Input
							id="shipmentId"
							placeholder="Enter ID"
							{...register("shipmentId")}
							disabled={isLoading}
						/>
						<FieldError message={errors.shipmentId?.message} />
					</div>
					<Button type="submit" className="w-full" disabled={isLoading}>
						{isLoading ? "Generating..." : "Generate Label"}
					</Button>
				</form>
			</FormWrapper>
		</div>
	);
};

export default LabelMakerPage;
