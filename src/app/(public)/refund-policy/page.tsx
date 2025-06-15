"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ChevronDown, ChevronUp } from "lucide-react";

const policies = [
  {
    title: "Return and Refund Policy",
    sections: [
      {
        title: "Introduction",
        content:
          "Thank you for using Nex Gen Courier Service. This policy outlines the conditions under which returns and refunds are processed.",
      },
      {
        title: "Refund Policy",
        content:
          "Refunds: Refunds will be processed for valid returns as per our return policy. The amount will be refunded to the original payment method or as credit to your account, depending on the circumstances. Processing Time: Refunds may take up to 7 business days to process once the return is approved.",
      },
      {
        title: "Non-Refundable Items",
        content:
          "Certain services or items may not be eligible for refunds, including but not limited to delivery charges and items damaged due to improper packaging.",
      },
    ],
  },
  {
    title: "Wallet Policy",
    sections: [
      {
        title: "Wallet Balance",
        content:
          "Usage: Wallet balance can only be used to pay for future services and cannot be withdrawn or converted to cash. Refunds: Wallet balance is non-refundable except in case of account closure. If you have a remaining balance, you may use it for future transactions with Nex Gen Courier Service.",
      },
      {
        title: "Wallet Credits",
        content:
          "Adding Credits: Credits can be added to your wallet through [payment methods]. Ensure that the credit is applied before finalizing your transaction. Expiration: Wallet credits may have an expiration date or be subject to terms and conditions specific to promotional offers.",
      },
      {
        title: "Account Management",
        content:
          "You can view and manage your wallet balance and transactions through your account on our website or app.",
      },
      {
        title: "Wallet Closure and Refund",
        content:
          "When closing your account, remaining wallet balance will be transferred to your registered bank account within 7-10 business days. Ensure your bank details are up-to-date. Contact support@nexgencourierservice.in or call 1169653981 to initiate closure. Note: Bonus or promotional credits may not be eligible for transfer.",
      },
      {
        title: "Disputes",
        content:
          "Any issues or disputes related to wallet balance should be reported to us immediately. We will investigate and resolve any discrepancies according to our policies.",
      },
      {
        title: "Changes to Policy",
        content:
          "We reserve the right to update or modify this policy. Changes will be communicated through our website nexgencourierservice.in and will be effective immediately upon posting.",
      },
    ],
  },
];

export default function PolicyPage() {
  const [expandedPolicy, setExpandedPolicy] = useState<number | null>(null);
  const [expandedSection, setExpandedSection] = useState<number | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden px-4 py-12 sm:px-6 lg:px-8">
      <div
        className="absolute inset-0 "
        style={{
          filter: "blur(150px)",
          transform: `translate(${mousePosition.x * 0.01}px, ${
            mousePosition.y * 0.01
          }px)`,
        }}
      />
      <div className="relative z-10 mx-auto max-w-3xl">
        <motion.h1
          className="mb-8 text-center text-3xl font-bold text-blue-950"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          Refund Policy
        </motion.h1>
        {policies.map((policy, policyIndex) => (
          <motion.div
            key={policyIndex}
            className="mb-6 overflow-hidden rounded-lg bg-blue-100/20  shadow-sm backdrop-blur-lg"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: policyIndex * 0.1 }}
          >
            <button
              className="flex w-full items-center justify-between px-6 py-4 text-left focus:outline-none"
              onClick={() =>
                setExpandedPolicy(
                  expandedPolicy === policyIndex ? null : policyIndex
                )
              }
            >
              <h2 className="text-xl font-semibold text-blue-950">
                {policy.title}
              </h2>
              {expandedPolicy === policyIndex ? (
                <ChevronUp className="h-6 w-6 text-blue-950" />
              ) : (
                <ChevronDown className="h-6 w-6 text-blue-950" />
              )}
            </button>
            <motion.div
              initial={false}
              animate={{
                height: expandedPolicy === policyIndex ? "auto" : 0,
              }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              {policy.sections.map((section, sectionIndex) => (
                <div key={sectionIndex} className="border-t border-blue-200">
                  <button
                    className="flex w-full items-center justify-between px-6 py-3 text-left focus:outline-none"
                    onClick={() =>
                      setExpandedSection(
                        expandedSection === sectionIndex ? null : sectionIndex
                      )
                    }
                  >
                    <h3 className="text-lg font-medium text-blue-950">
                      {section.title}
                    </h3>
                    {expandedSection === sectionIndex ? (
                      <ChevronUp className="h-5 w-5 text-blue-950" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-blue-950" />
                    )}
                  </button>
                  <motion.div
                    initial={false}
                    animate={{
                      height: expandedSection === sectionIndex ? "auto" : 0,
                    }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <p className="px-6 pb-4 text-blue-950">{section.content}</p>
                  </motion.div>
                </div>
              ))}
            </motion.div>
          </motion.div>
        ))}
        <div className="mt-8 text-center text-blue-950">
          <p>
            For any questions or concerns about our policies, please contact us
            at support@nexgencourierservice.in or call us at 91+1169653981.
          </p>
        </div>
      </div>
    </div>
  );
}
