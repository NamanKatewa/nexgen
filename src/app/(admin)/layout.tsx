import "~/styles/globals.css";

import type { Metadata } from "next";
import { Geist } from "next/font/google";

import AdminSidebar from "~/components/AdminSidebar";
import Navbar from "~/components/Navbar";
import { Toaster } from "~/components/ui/sonner";
import { TRPCReactProvider } from "~/trpc/react";

export const metadata: Metadata = {
	title: "NexGen Courier Services",
	description: "Dashboard",
	icons: [{ rel: "icon", url: "/favicon.ico" }],
};

const geist = Geist({
	subsets: ["latin"],
	variable: "--font-geist-sans",
});

export default function RootLayout({
	children,
}: Readonly<{ children: React.ReactNode }>) {
	return (
		<html lang="en" className={`${geist.variable}`}>
			<body className="mt-16 ml-8 bg-blue-50 md:ml-64">
				<TRPCReactProvider>
					<Navbar />
					<AdminSidebar />
					{children}
					<Toaster />
				</TRPCReactProvider>
			</body>
		</html>
	);
}
