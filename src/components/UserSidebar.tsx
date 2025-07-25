"use client";

import clsx from "clsx";
import {
	Calculator,
	ChevronLeft,
	ChevronRight,
	IdCard,
	IndianRupee,
	LayoutDashboard,
	NotebookText,
	Package,
	PackagePlus,
	Truck,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "~/components/ui/button";

const sidebarLinks = [
	{ href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
	{ href: "/dashboard/passbook", icon: NotebookText, label: "Passbook" },
	{
		href: "/dashboard/create-shipment",
		icon: PackagePlus,
		label: "Create Shipment",
	},
	// {
	// 	href: "/dashboard/create-bulk-shipment",
	// 	icon: PackagePlus,
	// 	label: "Create Bulk Shipment",
	// },
	{
		href: "/dashboard/tracking",
		icon: Truck,
		label: "Tracking",
	},
	{
		href: "/dashboard/ndr",
		icon: Truck,
		label: "NDR",
	},
	{
		href: "/dashboard/shipments",
		icon: Package,
		label: "My Shipments",
	},
	{
		href: "/dashboard/support",
		icon: IdCard,
		label: "Support",
	},
	{
		href: "/dashboard/rates",
		icon: IndianRupee,
		label: "Rates",
	},
	{
		href: "/dashboard/rate-calculator",
		icon: Calculator,
		label: "Rate Calculator",
	},
];

const UserSidebar = () => {
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
					"fixed top-16 left-0 z-40 h-[calc(100vh-4rem)] border-r bg-blue-100 shadow-lg transition-all duration-300 ease-in-out",
					isOpen ? "w-full md:w-64" : "w-6 md:w-64",
				)}
				style={{ overflow: "visible" }}
			>
				{(isOpen ||
					(typeof window !== "undefined" && window.innerWidth >= 768)) && (
					<div className="flex h-full flex-col gap-4 p-4">
						{sidebarLinks.map(({ href, icon: Icon, label }) => {
							let isActive = false;
							if (href === "/dashboard") {
								isActive = pathname === "/dashboard";
							} else {
								isActive = pathname.startsWith(href);
							}
							return (
								<Link
									key={href}
									href={href}
									className={clsx(
										"flex items-center gap-2 rounded px-2 py-4 text-sm transition md:text-xs",
										isActive
											? "bg-blue-300 font-semibold text-blue-900"
											: "hover:bg-blue-200",
									)}
								>
									<Icon className="h-4 w-4" />
									{label}
								</Link>
							);
						})}
					</div>
				)}

				{/* Toggle button – only on mobile */}
				<div className="-translate-y-1/2 absolute top-1/2 right-[-16px] z-50 md:hidden">
					<Button
						variant="secondary"
						size="icon"
						className="rounded-full border bg-blue-100 shadow"
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
					className="fixed inset-0 z-30 bg-black/40 md:hidden"
					onClick={toggleSidebar}
					onKeyDown={(e) => {
						if (e.key === "Escape") {
							toggleSidebar();
						}
					}}
					role="button"
					tabIndex={0}
				/>
			)}
		</>
	);
};

export default UserSidebar;
