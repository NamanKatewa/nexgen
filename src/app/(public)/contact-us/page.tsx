"use client";

import React from "react";
import { Phone, MessageCircle, MapPin } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { cn } from "~/lib/utils";

const ContactPage = () => {
  const contactInfo = [
    { icon: Phone, text: "Call us at: +91 11 6965 3981 " },
    {
      icon: MessageCircle,
      text: "Message us directly on WhatsApp to book now!",
    },
  ];

  return (
    <section className="w-full py-16 md:py-24">
      <div className="container mx-auto px-4 md:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-16 text-center"
        >
          <h2 className="mb-4 text-4xl font-bold tracking-tight text-blue-950 sm:text-5xl">
            Get in Touch
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-blue-950">
            We&apos;re here to help. Reach out to us through any of the
            following methods.
          </p>
        </motion.div>
        <div className="mb-20 flex justify-center">
          {contactInfo.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group flex flex-col items-center text-center w-1/2"
            >
              <div className="mb-4 rounded-full bg-blue-100/20 p-4 shadow-lg transition-all duration-300 group-hover:bg-blue-200">
                <item.icon className="h-8 w-8 text-primary transition-colors duration-300 group-hover:text-primary/80" />
              </div>
              <p className="text-lg font-medium text-blue-950 w-1/2">
                {item.text}
              </p>
            </motion.div>
          ))}
        </div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mb-20 rounded-xl bg-blue-100/20 p-8 shadow-xl"
        >
          <div className="flex items-start">
            <MapPin className="mr-8 h-8 w-8 flex-shrink-0 text-primary" />
            <div>
              <h3 className="mb-3 text-2xl font-semibold text-blue-950">
                Our Address
              </h3>
              <p className="mt-3 w-full text-left text-blue-950 ">
                395-A Chauhan Mohhala Madanpur Khadar
                <br />
                Sarita Vihar
                <br />
                <span className="font-medium">Pincode:</span> 110076
              </p>
            </div>
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="text-center"
        >
          <Link
            href="https://wa.aisensy.com/9LpM1r"
            target="_blank"
            className={cn(
              "rounded-xl bg-blue-950 px-8 py-4 text-lg font-semibold text-orange-100 transition-all duration-300 hover:bg-primary/90 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            )}
          >
            Send Us a Message
          </Link>
        </motion.div>
      </div>
    </section>
  );
};

export default ContactPage;
