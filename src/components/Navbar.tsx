"use client";

import { useState, useEffect } from "react";
import { LogIn, Menu, LogOut, LayoutDashboard } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "~/components/ui/button";
import { motion } from "motion/react";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "~/components/ui/avatar";
import { api } from "~/trpc/react";

const NavItems = ["Home", "Services", "Contact Us", "Track", "Rate Calculator"];

interface UserInfo {
  email: string;
  role: string;
  name?: string;
}

const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const router = useRouter();

  const { data: user, isLoading } = api.auth.me.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
  });

  const utils = api.useUtils();

  const handleLogout = async () => {
    localStorage.removeItem("token");

    document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";

    await utils.invalidate();

    router.push("/");

    router.refresh();
  };
  const getDashboardRoute = () => {
    if (!user) return "/dashboard";

    return user.role === "Admin" ? "/admin/dashboard" : "/dashboard";
  };

  const getInitials = (name?: string, email?: string) => {
    if (name && name.trim()) {
      const initials = name
        .trim()
        .split(" ")
        .map((n) => n[0])
        .filter(Boolean)
        .join("")
        .toUpperCase();

      return initials.slice(0, 2) || "U";
    }

    if (email && email.trim()) {
      return email.trim()[0]?.toUpperCase() || "U";
    }

    return "U";
  };

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
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-10 w-10 rounded-full"
                >
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-blue-100 text-blue-600">
                      {getInitials(user.name, user.email)}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {user.name || "User"}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => router.push(getDashboardRoute())}
                >
                  <LayoutDashboard className="mr-2 h-4 w-4" />
                  <span>Dashboard</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link href="/login">
                <Button
                  variant="outline"
                  className="flex items-center gap-2 border-blue-200 text-blue-500 transition-colors duration-200 ease-in-out hover:bg-blue-50 hover:text-blue-600 cursor-pointer"
                  disabled={isLoading}
                >
                  <LogIn className="h-4 w-4" />
                  <span>Login</span>
                </Button>
              </Link>
            </motion.div>
          )}
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
            {user ? (
              <div className="space-y-2">
                <Link href={getDashboardRoute()}>
                  <Button variant="outline" className="w-32">
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    Dashboard
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  className="w-32"
                  onClick={handleLogout}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </Button>
              </div>
            ) : (
              <Link href="/login">
                <Button
                  variant="outline"
                  className="cursor-pointer"
                  disabled={isLoading}
                >
                  <LogIn className="mr-2 h-4 w-4" />
                  <span>Login</span>
                </Button>
              </Link>
            )}
          </motion.li>
        </ul>
      </motion.div>
    </motion.nav>
  );
};

export default Navbar;
