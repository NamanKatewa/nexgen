"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Input } from "~/components/ui/input";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "~/components/ui/table";
import { api } from "~/trpc/react";

interface DefaultRate {
	default_rate_id: string;
	zone_from: string;
	zone_to: string;
	weight_slab: number;
	rate: number;
}

export default function AdminRatesPage() {
	const [rates, setRates] = useState<DefaultRate[]>([]);
	const { data, isLoading, refetch } = api.rate.getDefaultRates.useQuery();
	const updateRateMutation = api.rate.updateDefaultRate.useMutation({
		onSuccess: () => {
			toast.success("Rate updated successfully!");
			void refetch();
		},
		onError: (error) => {
			toast.error("Failed to update rate.", {
				description: error.message,
			});
		},
	});

	useEffect(() => {
		if (data) {
			setRates(data);
		}
	}, [data]);

	const handleRateChange = (
		id: string,
		field: keyof DefaultRate,
		value: string,
	) => {
		setRates((prevRates) =>
			prevRates.map((rate) =>
				rate.default_rate_id === id
					? { ...rate, [field]: Number.parseFloat(value) || 0 }
					: rate,
			),
		);
	};

	const handleRateBlur = (rate: DefaultRate) => {
		updateRateMutation.mutate({
			id: rate.default_rate_id,
			rate: rate.rate,
		});
	};

	const { uniqueWeightSlabs, uniqueZoneTos, ratesMatrix } = useMemo(() => {
		const weightSlabs = Array.from(
			new Set(rates.map((r) => r.weight_slab)),
		).sort((a, b) => a - b);
		const zoneTos = Array.from(new Set(rates.map((r) => r.zone_to))).sort();

		const matrix: Record<string, Record<string, DefaultRate>> = {};

		for (const rate of rates) {
			const weightSlabKey = String(rate.weight_slab);
			if (!matrix[weightSlabKey]) {
				matrix[weightSlabKey] = {};
			}
			matrix[weightSlabKey][rate.zone_to] = rate;
		}

		return {
			uniqueWeightSlabs: weightSlabs,
			uniqueZoneTos: zoneTos,
			ratesMatrix: matrix,
		};
	}, [rates]);

	if (isLoading) {
		return (
			<div className="flex h-screen items-center justify-center text-blue-950">
				Loading rates...
			</div>
		);
	}

	return (
		<div className="container mx-auto py-10">
			<h1 className="mb-6 font-semibold text-2xl text-blue-950">
				Default Shipping Rates Matrix
			</h1>
			<div className="overflow-x-auto">
				<Table className="min-w-full table-auto text-blue-950">
					<TableHeader className="bg-blue-100 shadow-sm">
						<TableRow>
							<TableHead className="w-32">Weight Slab (kg)</TableHead>
							{uniqueZoneTos.map((zoneTo) => (
								<TableHead key={zoneTo} className="text-center">
									Zone {zoneTo.toUpperCase()}
								</TableHead>
							))}
						</TableRow>
					</TableHeader>
					<TableBody>
						{uniqueWeightSlabs.map((weightSlab) => (
							<TableRow key={weightSlab} className="hover:bg-blue-50">
								<TableCell className="text-center font-medium">
									{weightSlab}
								</TableCell>
								{uniqueZoneTos.map((zoneTo) => {
									const rate = ratesMatrix[String(weightSlab)]?.[zoneTo];
									return (
										<TableCell
											key={`${weightSlab}-${zoneTo}`}
											className="text-center"
										>
											{rate ? (
												<Input
													type="number"
													value={rate.rate}
													onChange={(e) =>
														handleRateChange(
															rate.default_rate_id,
															"rate",
															e.target.value,
														)
													}
													onBlur={() => handleRateBlur(rate)}
													className="mx-auto w-24 text-center"
												/>
											) : (
												<span className="block text-center text-gray-500">
													N/A
												</span>
											)}
										</TableCell>
									);
								})}
							</TableRow>
						))}
					</TableBody>
				</Table>
			</div>
		</div>
	);
}
