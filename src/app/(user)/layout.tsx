import "~/styles/globals.css";

import type { Metadata } from "next";
import { Geist } from "next/font/google";

import { TRPCReactProvider } from "~/trpc/react";
import Navbar from "~/components/Navbar";
import Footer from "~/components/Footer";

// Set font config outside render path
const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
  display: "swap", // Improves perceived performance by avoiding blocking render
});

export const metadata: Metadata = {
  title: "NexGen Courier Services",
  description: "",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={geist.variable}>
      <body className="bg-blue-50 mt-16 antialiased text-blue-950">
        <TRPCReactProvider>
          <Navbar />
          {children}
          <Footer />
        </TRPCReactProvider>
      </body>
    </html>
  );
}
