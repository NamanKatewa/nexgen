import "~/styles/globals.css";

import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { TRPCReactProvider } from "~/trpc/react";

import Navbar from "~/components/Navbar";
import Footer from "~/components/Footer";
import Sidebar from "~/components/AdminSidebar";

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
    <html lang="en">
      <body className={`bg-blue-50 ${geist.variable}`} suppressHydrationWarning>
        <TRPCReactProvider>
          <Navbar />
          <Sidebar />
          <main className="ml-8 md:ml-64 mt-16 min-h-screen">{children}</main>
          <Footer />
        </TRPCReactProvider>
      </body>
    </html>
  );
}
