import "~/styles/globals.css";

import Navbar from "~/components/Navbar";
import Footer from "~/components/Footer";

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <body className="bg-blue-50">
      <Navbar />
      {children}
      <Footer />
    </body>
  );
}
