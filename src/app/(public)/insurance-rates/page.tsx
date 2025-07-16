import Link from "next/link";
import React from "react";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "~/components/ui/table";

const InsuranceRatesPage = () => {
	return (
		<div className="container mx-auto px-4 py-8">
			<h1 className="mb-6 font-bold text-3xl text-blue-900">
				Insurance Rates & Compensation
			</h1>

			<section className="mb-8">
				<h2 className="mb-4 font-semibold text-2xl text-blue-800">
					Mandatory Insurance Conditions
				</h2>
				<ul className="list-disc pl-6 text-gray-700">
					<li>Insurance is mandatory for shipments with rate above ₹5,000.</li>
					<li>Shipments with an actual rate above ₹49,999 are not accepted.</li>
				</ul>
			</section>

			<section className="mb-8">
				<h2 className="mb-4 font-semibold text-2xl text-blue-800">
					Insurance Rate Tiers
				</h2>
				<div className="overflow-x-auto">
					<Table className="min-w-full table-auto border-collapse rounded-lg bg-white shadow-md">
						<TableHeader>
							<TableRow className="bg-blue-100 text-blue-700">
								<TableHead className="border px-4 py-2 text-left">
									Rate Range
								</TableHead>
								<TableHead className="border px-4 py-2 text-left">
									Premium
								</TableHead>
								<TableHead className="border px-4 py-2 text-left">
									Compensation
								</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							<TableRow>
								<TableCell className="border px-4 py-2">₹1 – ₹2,499</TableCell>
								<TableCell className="border px-4 py-2">₹100</TableCell>
								<TableCell className="border px-4 py-2">100%</TableCell>
							</TableRow>
							<TableRow>
								<TableCell className="border px-4 py-2">
									₹2,500 – ₹5,000
								</TableCell>
								<TableCell className="border px-4 py-2">₹100</TableCell>
								<TableCell className="border px-4 py-2">80%</TableCell>
							</TableRow>
							<TableRow>
								<TableCell className="border px-4 py-2">
									₹5,001 – ₹12,999
								</TableCell>
								<TableCell className="border px-4 py-2">2%</TableCell>
								<TableCell className="border px-4 py-2">80%</TableCell>
							</TableRow>
							<TableRow>
								<TableCell className="border px-4 py-2">
									₹13,000 – ₹21,999
								</TableCell>
								<TableCell className="border px-4 py-2">2.1% – 2.9%</TableCell>
								<TableCell className="border px-4 py-2">58% – 78%</TableCell>
							</TableRow>
							<TableRow>
								<TableCell className="border px-4 py-2">
									₹22,000 – ₹26,999
								</TableCell>
								<TableCell className="border px-4 py-2">3%</TableCell>
								<TableCell className="border px-4 py-2">51% – 55%</TableCell>
							</TableRow>
							<TableRow>
								<TableCell className="border px-4 py-2">
									₹27,000 – ₹49,999
								</TableCell>
								<TableCell className="border px-4 py-2">3%</TableCell>
								<TableCell className="border px-4 py-2">50%</TableCell>
							</TableRow>
						</TableBody>
					</Table>
				</div>
			</section>

			<section>
				<h2 className="mb-4 font-semibold text-2xl text-blue-800">
					Important Notes
				</h2>
				<ul className="list-disc pl-6 text-gray-700">
					<li>All rates and compensation percentages are subject to change.</li>
					<li>
						Compensation is based on the lower of the declared value or actual
						loss, as determined by our claims process.
					</li>
					<li>
						For full terms and conditions, please refer to our{" "}
						<span>
							<Link
								href="/terms-conditions"
								className="text-blue-500 hover:underline"
							>
								Terms &amp; Conditions
							</Link>
						</span>
						.
					</li>
				</ul>
			</section>
		</div>
	);
};

export default InsuranceRatesPage;
