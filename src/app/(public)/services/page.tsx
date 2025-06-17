"use client";

import React, { memo } from "react";
import { Package, Check, Truck, Clock, ShieldCheck } from "lucide-react";
import Link from "next/link";

const offerings = [
  "Only Pre-Paid Orders",
  "Minimum 300 Orders Monthly",
  "Zero Discrepancy Charges",
  "Zero RTO Charges",
  "Zero Extra Charges",
  "Zero Volumetric Charges",
];

const reasons = [
  {
    icon: Clock,
    text: "Fast and efficient delivery times",
  },
  {
    icon: ShieldCheck,
    text: "Secure handling of all packages",
  },
  {
    icon: Package,
    text: "Transparent pricing with no hidden fees",
  },
];

const OfferingsSection = memo(() => (
  <div className="rounded-lg bg-blue-100/20 p-6 shadow-lg backdrop-blur-md transition-all hover:shadow-xl">
    <h3 className="mb-4 flex items-center text-xl font-semibold text-gray-800">
      <Package className="mr-2 text-blue-950" />
      Our Offerings
    </h3>
    <ul className="space-y-2">
      {offerings.map((item) => (
        <li key={item} className="flex items-center">
          <Check className="mr-2 text-green-500" />
          <span className="text-blue-950">{item}</span>
        </li>
      ))}
    </ul>
  </div>
));

const BenefitsSection = memo(() => (
  <div className="rounded-lg bg-blue-100/20 p-6 shadow-lg backdrop-blur-md transition-all hover:shadow-xl">
    <h3 className="mb-4 flex items-center text-xl font-semibold text-gray-800">
      <Truck className="mr-2 text-blue-950" />
      Why Choose Us?
    </h3>
    <ul className="space-y-4">
      {reasons.map(({ icon: Icon, text }) => (
        <li key={text} className="flex items-start">
          <Icon className="mr-2 mt-1 flex-shrink-0 text-blue-600" />
          <span className="text-blue-950">{text}</span>
        </li>
      ))}
    </ul>
  </div>
));

const ServicesPage = () => {
  return (
    <div className="min-h-screen">
      <main className="container mx-auto min-h-[90vh] px-4 py-12">
        <section className="mb-12 text-center">
          <h2 className="mb-12 text-4xl font-bold text-blue-950">
            Our Services
          </h2>
          <p className="mb-4 text-xl text-blue-950">
            Fast, Reliable, and Secure Courier Services
          </p>
          <p className="text-lg font-semibold text-blue-600">
            Specializing in safe and timely deliveries
          </p>
        </section>

        <section className="mb-12 grid gap-4 md:grid-cols-2">
          <OfferingsSection />
          <BenefitsSection />
        </section>

        <section className="text-center">
          <h3 className="mb-8 text-2xl font-semibold text-blue-950">
            Ready to experience next-generation courier service?
          </h3>
          <Link
            href="/register"
            className="px-5 py-3 rounded-xl cursor-pointer bg-blue-500 text-orange-100 font-semibold tracking-wider hover:bg-blue-600"
          >
            Get Started Now
          </Link>
        </section>
      </main>
    </div>
  );
};

export default ServicesPage;
