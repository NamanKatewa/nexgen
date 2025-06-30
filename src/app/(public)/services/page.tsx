import { Check, Clock, Package, ShieldCheck, Truck } from "lucide-react";
import Link from "next/link";
import React from "react";
import { buttonVariants } from "~/components/ui/button";

const ServicesPage = () => {
	return (
		<div className="min-h-screen">
			<main className="container mx-auto min-h-[90vh] px-4 py-12">
				<section className="mb-12 text-center">
					<h2 className="mb-12 font-bold text-4xl text-blue-950">
						Our Services
					</h2>
					<p className="mb-4 text-blue-950 text-xl">
						Fast, Reliable, and Secure Courier Services
					</p>
					<p className="font-semibold text-blue-600 text-lg">
						Specializing in safe and timely deliveries
					</p>
				</section>
				<section className="mb-12 grid gap-4 md:grid-cols-2">
					<div className="rounded-lg bg-blue-100/20 p-6 shadow-lg backdrop-blur-md transition-all hover:shadow-xl">
						<h3 className="mb-4 flex items-center font-semibold text-gray-800 text-xl">
							<Package className="mr-2 text-blue-950" />
							Our Offerings
						</h3>
						<ul className="space-y-2">
							{[
								"Only Pre-Paid Orders",
								"Minimum 300 Orders Monthly",
								"Zero Discrepancy Charges",
								"Zero RTO Charges",
								"Zero Extra Charges",
								"Zero Volumetric Charges",
							].map((item) => (
								<li key={item} className="flex items-center">
									<Check className="mr-2 text-green-500" />
									<span className="text-blue-950">{item}</span>
								</li>
							))}
						</ul>
					</div>
					<div className="rounded-lg bg-blue-100/20 p-6 shadow-lg backdrop-blur-md transition-all hover:shadow-xl">
						<h3 className="mb-4 flex items-center font-semibold text-gray-800 text-xl">
							<Truck className="mr-2 text-blue-950" />
							Why Choose Us?
						</h3>
						<ul className="space-y-4">
							<li className="flex items-start">
								<Clock className="mt-1 mr-2 flex-shrink-0 text-blue-600" />
								<span className="text-blue-950">
									Fast and efficient delivery times
								</span>
							</li>
							<li className="flex items-start">
								<ShieldCheck className="mt-1 mr-2 flex-shrink-0 text-blue-600" />
								<span className="text-blue-950">
									Secure handling of all packages
								</span>
							</li>
							<li className="flex items-start">
								<Package className="mt-1 mr-2 flex-shrink-0 text-blue-600" />
								<span className="text-blue-950">
									Transparent pricing with no hidden fees
								</span>
							</li>
						</ul>
					</div>
				</section>
				<section className="text-center">
					<h3 className="mb-8 font-semibold text-2xl text-blue-950">
						Ready to experience next-generation courier service?
					</h3>
					<Link
						href="/register"
						className="cursor-pointer rounded-xl bg-blue-500 px-5 py-3 font-semibold text-orange-100 tracking-wider hover:bg-blue-600"
					>
						Get Started Now
					</Link>
				</section>
			</main>
		</div>
	);
};

export default ServicesPage;
