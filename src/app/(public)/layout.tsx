import "~/styles/globals.css";

import type { Metadata } from "next";
import { Geist } from "next/font/google";

import Footer from "~/components/Footer";
import Navbar from "~/components/Navbar";
import { Toaster } from "~/components/ui/sonner";
import { TRPCReactProvider } from "~/trpc/react";

export const metadata: Metadata = {
	title: "NexGen Courier Services",
	description: "",
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
			<body className="mt-16 bg-blue-50">
				<TRPCReactProvider>
					<Navbar />
					{children}
					<Footer />
					<Toaster />
				</TRPCReactProvider>
			</body>
		</html>
	);
}
