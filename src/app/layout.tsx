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
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "PartyOps - Run your party hire business from one place",
    description:
      "Bookings, calendar, customers, invoices, and payments for party hire operators.",
    images: ["/og-image.png"],
  },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
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
