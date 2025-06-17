"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import { ChevronDown, ChevronUp } from "lucide-react";

const sections = [
  {
    title: "Introduction",
    content:
      "Welcome to Nex Gen Courier Service. We value your privacy and are committed to protecting your personal data. This privacy policy explains how we collect, use, disclose, and safeguard your information when you use our services.",
  },
  {
    title: "Information We Collect",
    content:
      "We collect personal information (name, address, phone number, email), transaction information (delivery addresses, payment details), and usage data (IP addresses, browser types, pages visited).",
  },
  {
    title: "How We Use Your Information",
    content:
      "We use your information to provide and manage our courier services, process payments, communicate with you, improve our services, and ensure legal compliance.",
  },
  {
    title: "Data Sharing and Disclosure",
    content:
      "We do not sell or rent your personal information. We may share information with service providers and legal authorities when required.",
  },
  {
    title: "Data Security",
    content:
      "We implement appropriate security measures to protect your personal data, but no method of transmission over the internet is 100% secure.",
  },
  {
    title: "Your Rights",
    content:
      "You have the right to access, update, delete your personal information, object to processing, and request a copy of your data.",
  },
  {
    title: "Cookies and Tracking Technologies",
    content:
      "We use cookies and similar technologies to enhance your experience. You can manage cookie preferences through your browser settings.",
  },
  {
    title: "Changes to This Privacy Policy",
    content:
      "We may update this policy from time to time. Changes will be posted on our website and effective immediately.",
  },
  {
    title: "Contact Us",
    content:
      "If you have any questions or concerns, please contact us at support@nexgencourierservice.in.",
  },
];

export default function PrivacyPolicy() {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  const handleMouseMove = useCallback((e: MouseEvent) => {
    setMousePosition({ x: e.clientX, y: e.clientY });
  }, []);

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [handleMouseMove]);

  const backgroundStyle = useMemo(
    () => ({
      filter: "blur(150px)",
      transform: `translate(${mousePosition.x * 0.01}px, ${
        mousePosition.y * 0.01
      }px)`,
    }),
    [mousePosition]
  );

  const toggleSection = useCallback((index: number) => {
    setExpandedIndex((prev) => (prev === index ? null : index));
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden px-4 py-12 sm:px-6 lg:px-8">
      <div className="absolute inset-0" style={backgroundStyle} />

      <div className="relative z-10 mx-auto max-w-3xl">
        <motion.h1
          className="mb-8 text-center text-3xl font-bold text-blue-950"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          Privacy Policy
        </motion.h1>

        {sections.map((section, index) => {
          const isExpanded = expandedIndex === index;
          return (
            <motion.div
              key={index}
              layout
              className="mb-4 overflow-hidden rounded-lg bg-blue-200/20 shadow-sm backdrop-blur-lg"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <button
                className="flex w-full items-center justify-between px-6 py-4 text-left focus:outline-none"
                onClick={() => toggleSection(index)}
                aria-expanded={isExpanded}
              >
                <h2 className="text-lg font-medium text-blue-950">
                  {section.title}
                </h2>
                {isExpanded ? (
                  <ChevronUp className="h-5 w-5 text-blue-950" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-blue-950" />
                )}
              </button>

              <motion.div
                initial={false}
                animate={{ height: isExpanded ? "auto" : 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <p className="px-6 pb-4 text-blue-950">{section.content}</p>
              </motion.div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
