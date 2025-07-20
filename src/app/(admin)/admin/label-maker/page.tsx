"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";

import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { api } from "~/trpc/react";
import { FormWrapper } from "~/components/FormWrapper";
import { FieldError } from "~/components/FieldError";

const formSchema = z.object({
	shipmentId: z.string().min(1, "ID cannot be empty"),
});

const LabelMakerPage = () => {
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

	const generateLabelMutation = api.label.generateLabel.useMutation({
		onSuccess: (data) => {
			const link = document.createElement("a");
			link.href = `data:application/pdf;base64,${data.pdf}`;
			link.download = `label-${getValues("shipmentId")}.pdf`;
			link.click();
			toast.success("Label generated successfully");
		},
		onError: (error) => {
			toast.error(error.message);
		},
	});

	const onSubmit = (values: z.infer<typeof formSchema>) => {
		generateLabelMutation.mutate(values);
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
							disabled={generateLabelMutation.isPending}
						/>
						<FieldError message={errors.shipmentId?.message} />
					</div>
					<Button
						type="submit"
						className="w-full"
						disabled={generateLabelMutation.isPending}
					>
						{generateLabelMutation.isPending
							? "Generating..."
							: "Generate Label"}
					</Button>
				</form>
			</FormWrapper>
		</div>
	);
};

export default LabelMakerPage;
