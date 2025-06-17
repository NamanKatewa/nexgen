"use client";

import { useEffect, useState } from "react";
import { Button } from "~/components/ui/button";
import {
  ChevronRight,
  ChevronLeft,
  LayoutDashboard,
  Package,
  FileUser,
} from "lucide-react";
import Link from "next/link";
import clsx from "clsx";
import { usePathname } from "next/navigation";

const sidebarLinks = [
  { href: "/admin/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/admin/kyc-verify", icon: FileUser, label: "Verify KYC" },
  { href: "/admin/orders", icon: Package, label: "Orders" },
  {
    href: "/admin/order-requests",
    icon: LayoutDashboard,
    label: "Order Requests",
  },
  { href: "/admin/all-orders", icon: LayoutDashboard, label: "All Orders" },
  {
    href: "/admin/tracking/dashboard",
    icon: LayoutDashboard,
    label: "Tracking Dashboard",
  },
  {
    href: "/admin/revenue/dashboard",
    icon: LayoutDashboard,
    label: "Revenue Dashboard",
  },
  { href: "/admin/label-maker", icon: LayoutDashboard, label: "Label Maker" },
  { href: "/admin/approve-users", icon: LayoutDashboard, label: "Users" },
  { href: "/admin/employees", icon: LayoutDashboard, label: "Employees" },
  { href: "/admin/support", icon: LayoutDashboard, label: "Support" },
  { href: "/admin/payments", icon: LayoutDashboard, label: "Payments" },
  {
    href: "/admin/payment-history",
    icon: LayoutDashboard,
    label: "Payment History",
  },
  { href: "/admin/promotions", icon: LayoutDashboard, label: "Promotions" },
  { href: "/admin/rates", icon: LayoutDashboard, label: "Rates" },
];

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  const toggleSidebar = () => setIsOpen(!isOpen);
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <>
      <aside
        className={clsx(
          "fixed top-16 left-0 z-40 h-[calc(100vh-4rem)] bg-blue-100 shadow-lg border-r transition-all duration-300 ease-in-out",
          isOpen ? "w-full md:w-64" : "w-6 md:w-64"
        )}
        style={{ overflow: "visible" }}
      >
        {(isOpen ||
          (typeof window !== "undefined" && window.innerWidth >= 768)) && (
          <div className="h-full flex flex-col p-4 gap-4">
            {sidebarLinks.map(({ href, icon: Icon, label }) => {
              const isActive = pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={clsx(
                    "flex items-center gap-2 text-sm md:text-xs px-2 py-4 rounded transition",
                    isActive
                      ? "bg-blue-300 font-semibold text-blue-900"
                      : "hover:bg-blue-200"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </Link>
              );
            })}
          </div>
        )}

        {/* Toggle button – only on mobile */}
        <div className="absolute top-1/2 -translate-y-1/2 right-[-16px] z-50 md:hidden">
          <Button
            variant="secondary"
            size="icon"
            className="rounded-full shadow bg-blue-100 border"
            onClick={toggleSidebar}
            aria-label={isOpen ? "Collapse sidebar" : "Expand sidebar"}
          >
            {isOpen ? (
              <ChevronLeft className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
        </div>
      </aside>

      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 md:hidden"
          onClick={toggleSidebar}
        />
      )}
    </>
  );
};

export default Sidebar;
