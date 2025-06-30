"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, ChevronUp } from "lucide-react";
import type React from "react";
import { useState } from "react";

const ExpandableSection = ({
	title,
	children,
}: {
	title: string;
	children: React.ReactNode;
}) => {
	const [isOpen, setIsOpen] = useState(false);

	return (
		<div className="border-blue-200 border-b py-4">
			<button
				type="button"
				className="flex w-full items-center justify-between text-left"
				onClick={() => setIsOpen(!isOpen)}
			>
				<h3 className="font-semibold text-blue-950 text-lg">{title}</h3>
				{isOpen ? (
					<ChevronUp className="h-5 w-5 " />
				) : (
					<ChevronDown className="h-5 w-5 " />
				)}
			</button>
			<AnimatePresence>
				{isOpen && (
					<motion.div
						initial={{ height: 0, opacity: 0, translateX: -100 }}
						animate={{ height: "auto", opacity: 1, translateX: 0 }}
						exit={{ height: 0, opacity: 0 }}
						transition={{ duration: 0.3 }}
						className="mt-2 text-blue-950"
					>
						{children}
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
};

export default function TermsAndConditions() {
	return (
		<div className="min-h-screen px-4 py-12 sm:px-6 lg:px-8">
			<div className="mx-auto max-w-3xl rounded-lg bg-blue-100/20 p-8 shadow-lg backdrop-blur-sm">
				<motion.h1
					initial={{ opacity: 0, y: -20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.5 }}
					className="mb-8 text-center font-extrabold text-3xl text-blue-950"
				>
					Terms and Conditions
				</motion.h1>

				<motion.p
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					transition={{ duration: 0.5, delay: 0.2 }}
					className="mb-8 text-blue-950 text-lg"
				>
					Welcome to Nex Gen Courier Service. These terms and conditions govern
					your use of our services. By using our services, you agree to these
					terms.
				</motion.p>

				<div className="space-y-4">
					<ExpandableSection title="1. Introduction">
						<p>
							Welcome to Nex Gen Courier Service. These terms and conditions
							govern your use of our services. By using our services, you agree
							to these terms.
						</p>
					</ExpandableSection>

					<ExpandableSection title="2. Services Provided">
						<p>
							Nex Gen Courier Service provides parcel delivery, logistics, and
							related courier services. We strive to deliver packages in a
							timely manner but cannot guarantee delivery times.
						</p>
					</ExpandableSection>

					<ExpandableSection title="3. User Responsibilities">
						<ul className="list-disc pl-5">
							<li>
								Ensure that the information provided for the delivery is
								accurate and complete.
							</li>
							<li>Pack items securely to avoid damage during transit.</li>
							<li>
								Comply with all applicable laws and regulations regarding the
								contents of the package.
							</li>
						</ul>
					</ExpandableSection>

					<ExpandableSection title="4. Fees and Payments">
						<ul className="list-disc pl-5">
							<li>
								Payment for our services must be made as per the agreed rates
								and within the stipulated time frame.
							</li>
							<li>
								Any additional charges incurred due to special handling or
								delivery issues will be communicated and billed accordingly.
							</li>
						</ul>
					</ExpandableSection>

					<ExpandableSection title="5. Liability">
						<ul className="list-disc pl-5">
							<li>
								Nex Gen Courier Service is not liable for any loss or damage to
								packages unless caused by our negligence.
							</li>
							<li>
								We are not responsible for delays caused by external factors
								such as weather, traffic, or customs.
							</li>
						</ul>
					</ExpandableSection>

					<ExpandableSection title="6. Claims and Refunds">
						<ul className="list-disc pl-5">
							<li>
								Any claims for loss or damage must be reported within [specific
								time frame] of delivery.
							</li>
							<li>
								Refunds, if applicable, will be processed as per our refund
								policy.
							</li>
						</ul>
					</ExpandableSection>

					<ExpandableSection title="7. Confidentiality">
						<p>
							We are committed to protecting your privacy and will not disclose
							any personal information to third parties except as required by
							law.
						</p>
					</ExpandableSection>

					<ExpandableSection title="8. Amendments">
						<p>
							We reserve the right to amend these terms and conditions at any
							time. Changes will be posted on our website and will be effective
							immediately upon posting.
						</p>
					</ExpandableSection>

					<ExpandableSection title="9. Governing Law">
						<p>
							These terms and conditions are governed by the laws of [Your
							Jurisdiction]. Any disputes arising from the use of our services
							will be subject to the exclusive jurisdiction of the courts in
							[Your Jurisdiction].
						</p>
					</ExpandableSection>

					<ExpandableSection title="10. Contact Us">
						<p>
							For any questions or concerns, please contact us at
							support@nexgencourierservice.in.
						</p>
					</ExpandableSection>
				</div>

				<motion.p
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					transition={{ duration: 0.5, delay: 0.5 }}
					className="mt-8 text-blue-950 text-sm"
				>
					By using Nex Gen Courier Service, you acknowledge that you have read,
					understood, and agree to be bound by these Terms and Conditions.
				</motion.p>
			</div>
		</div>
	);
}
