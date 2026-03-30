import type { Metadata } from "next";
import { DM_Sans, Playfair_Display } from "next/font/google";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
});

export const metadata: Metadata = {
  title: "LiquidRead",
  description: "A short quiz to calibrate how you read and use research.",
  openGraph: {
    title: "LiquidRead",
    description: "A short quiz to calibrate how you read and use research.",
    siteName: "LiquidRead",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${dmSans.variable} ${playfair.variable}`}>
      <body className="bg-[#F8F7F4] text-slate-900 font-sans antialiased">{children}</body>
    </html>
  );
}
