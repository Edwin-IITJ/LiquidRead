import type { Metadata } from "next";
import { Inter, Lora } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-sans",
  display: "swap",
});

const lora = Lora({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  style: ["normal", "italic"],
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
    <html lang="en" className={`${inter.variable} ${lora.variable}`}>
      <body className="bg-[#F2EDE4] text-[#2C2218] font-sans antialiased">{children}</body>
    </html>
  );
}
