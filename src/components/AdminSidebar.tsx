"use client";

import { useEffect, useState } from "react";
import { Button } from "~/components/ui/button";
import { ChevronRight, ChevronLeft } from "lucide-react";
import Link from "next/link";
import clsx from "clsx";

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  const toggleSidebar = () => setIsOpen(!isOpen);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <>
      {/* Sidebar */}
      <aside
        className={clsx(
          "fixed top-16 left-0 z-40 h-[calc(100vh-4rem)] bg-white shadow-lg border-r transition-all duration-300 ease-in-out",
          // Mobile widths (collapsible)
          isOpen ? "w-full md:w-64" : "w-6 md:w-64"
        )}
        style={{ overflow: "visible" }}
      >
        {/* Sidebar content – always visible on md+ */}
        {(isOpen ||
          (typeof window !== "undefined" && window.innerWidth >= 768)) && (
          <div className="h-full flex flex-col p-4 space-y-4">
            <Link href="/" className="text-sm md:text-xs hover:underline">
              Home
            </Link>
            <Link href="/orders" className="text-sm md:text-xs hover:underline">
              Orders
            </Link>
            <Link href="/track" className="text-sm md:text-xs hover:underline">
              Track
            </Link>
            <Link
              href="/support"
              className="text-sm md:text-xs hover:underline"
            >
              Support
            </Link>
          </div>
        )}

        {/* Toggle button – only on mobile */}
        <div className="absolute top-1/2 -translate-y-1/2 right-[-16px] z-50 md:hidden">
          <Button
            variant="secondary"
            size="icon"
            className="rounded-full shadow bg-white border"
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

      {/* Mobile overlay */}
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
