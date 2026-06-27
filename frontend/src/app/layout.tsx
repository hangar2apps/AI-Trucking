import type { Metadata } from "next";
import { Inter, Lora } from "next/font/google";
import "./globals.css";
import { PRODUCT_NAME } from "@/lib/brand";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const lora = Lora({
  variable: "--font-lora",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: `${PRODUCT_NAME} — AI Transportation Management`,
  description:
    "A-TMS by Aurora Freight — AI-powered fleet management, route optimization, and autonomous operations.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${lora.variable} h-full`}>
      <body className="min-h-full antialiased">{children}</body>
    </html>
  );
}
