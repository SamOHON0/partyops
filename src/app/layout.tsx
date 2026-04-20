import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "PartyOps - Run your party hire business from one place",
  description:
    "Bookings, calendar, customers, invoices, and payments for bouncy castle, marquee, and party hire operators. Built to feel easy. Built to save hours.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://partyops.app"),
  openGraph: {
    title: "PartyOps - Run your party hire business from one place",
    description:
      "Bookings, calendar, customers, invoices, and payments for party hire operators.",
    type: "website",
  },
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full bg-white text-ink-900 font-sans">
        {children}
      </body>
    </html>
  );
}
