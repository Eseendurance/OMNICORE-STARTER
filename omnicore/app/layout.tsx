import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://platform-gamma-neon.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "KiVo — Social commerce for growing businesses",
  description:
    "KiVo helps brands, creators, and local businesses sell online, build trust, and discover new customers through a social marketplace built for real growth.",
  alternates: {
    canonical: "/",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col bg-paper text-ink">
        <Navbar />
        <main className="flex-1 flex flex-col">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
