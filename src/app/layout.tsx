import type { Metadata } from "next";
import { Fraunces, Inter, Lilita_One } from "next/font/google";
import Providers from "@/components/Providers";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import "./globals.css";

const fraunces = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
});

const inter = Inter({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const lilitaOne = Lilita_One({
  variable: "--font-marquee",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: "FIT50 - The 50-Day Challenge",
  description:
    "50 Days · 9 Habits · 1 Finished Thing. The Fit50 Challenge. Fifty days, nine disciplines, and something tangible waiting for you on the other side.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth scroll-pt-20">
      <body
        className={`${fraunces.variable} ${inter.variable} ${lilitaOne.variable} font-body text-ink bg-paper antialiased`}
      >
        <Providers>
          <div className="min-h-screen flex flex-col">
            <Nav />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  );
}
