"use client";

import { useState } from "react";
import { LogIn, Menu } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "~/components/ui/button";
import { motion } from "motion/react";

const NavItems = ["Home", "Services", "Contact Us", "Track", "Rate Calculator"];

const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <motion.nav
      className="w-full bg-blue-50 px-8 shadow-sm backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="container mx-auto flex h-16 items-center justify-between lg:h-16 lg:px-4">
        <motion.div
          className="flex items-center text-blue-400 lg:order-1"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Link href="/">
            <Image src="/logo.png" height={40} width={80} alt="logo" />
          </Link>
        </motion.div>

        <div className="flex lg:hidden">
          <Button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            variant="ghost"
            size="icon"
            className="text-slate-500 hover:bg-slate-100 hover:text-slate-700"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>

        <div className="hidden w-full lg:order-2 lg:flex lg:w-auto">
          <ul className="flex justify-between font-medium text-slate-500">
            {NavItems.map((item) => (
              <motion.li
                key={item}
                className="lg:px-4 lg:py-2"
                whileHover={{ scale: 1.05, color: "#3B82F6" }}
                whileTap={{ scale: 0.95 }}
              >
                <Link
                  href={
                    item === "Home"
                      ? "/"
                      : `/${item
                          .toLowerCase()
                          .replace(/ & /g, "-")
                          .replace(/ /g, "-")}`
                  }
                  className="transition-colors duration-200 ease-in-out hover:text-blue-400"
                >
                  {item}
                </Link>
              </motion.li>
            ))}
          </ul>
        </div>

        <div className="hidden lg:order-3 lg:flex">
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Link href="/login">
              <Button
                variant="outline"
                className="flex items-center gap-2 border-blue-200 text-blue-500 transition-colors duration-200 ease-in-out hover:bg-blue-50 hover:text-blue-600 cursor-pointer"
              >
                <LogIn className="h-4 w-4" />
                <span>Login</span>
              </Button>
            </Link>
          </motion.div>
        </div>
      </div>

      <motion.div
        className={`lg:hidden ${isMobileMenuOpen ? "block" : "hidden"}`}
        initial={{ opacity: 0, height: 0 }}
        animate={{
          opacity: isMobileMenuOpen ? 1 : 0,
          height: isMobileMenuOpen ? "auto" : 0,
        }}
        transition={{ duration: 0.3 }}
      >
        <ul className="flex flex-col items-center justify-between py-4 font-medium text-slate-500">
          {NavItems.map((item, index) => (
            <motion.li
              key={item}
              className="w-full py-2 text-center"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: index * 0.05 }}
            >
              <Link
                href={
                  item === "Home"
                    ? "/"
                    : `/${item
                        .toLowerCase()
                        .replace(/ & /g, "-")
                        .replace(/ /g, "-")}`
                }
                className="block w-full transition-colors duration-200 ease-in-out hover:text-blue-400"
              >
                {item}
              </Link>
            </motion.li>
          ))}
          <motion.li
            className="mt-2 w-full py-2 text-center"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: 0.35 }}
          >
            <Link href="/login">
              <Button variant="outline" className="cursor-pointer">
                <LogIn className="h-4 w-4" />
                <span>Login</span>
              </Button>
            </Link>
          </motion.li>
        </ul>
      </motion.div>
    </motion.nav>
  );
};

export default Navbar;
