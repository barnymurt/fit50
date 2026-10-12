import type { Metadata } from "next";
import localFont from "next/font/local";
import Providers from "@/components/Providers";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import "./globals.css";

const fraunces = localFont({
  variable: "--font-display",
  display: "swap",
  src: [
    { path: "../../node_modules/@fontsource/fraunces/files/fraunces-latin-400-normal.woff2", weight: "400", style: "normal" },
    { path: "../../node_modules/@fontsource/fraunces/files/fraunces-latin-400-italic.woff2", weight: "400", style: "italic" },
    { path: "../../node_modules/@fontsource/fraunces/files/fraunces-latin-600-normal.woff2", weight: "600", style: "normal" },
    { path: "../../node_modules/@fontsource/fraunces/files/fraunces-latin-700-normal.woff2", weight: "700", style: "normal" },
  ],
});

const inter = localFont({
  variable: "--font-body",
  display: "swap",
  src: [
    { path: "../../node_modules/@fontsource/inter/files/inter-latin-400-normal.woff2", weight: "400", style: "normal" },
    { path: "../../node_modules/@fontsource/inter/files/inter-latin-500-normal.woff2", weight: "500", style: "normal" },
    { path: "../../node_modules/@fontsource/inter/files/inter-latin-600-normal.woff2", weight: "600", style: "normal" },
  ],
});

const lilitaOne = localFont({
  variable: "--font-marquee",
  display: "swap",
  src: [
    { path: "../../node_modules/@fontsource/lilita-one/files/lilita-one-latin-400-normal.woff2", weight: "400", style: "normal" },
  ],
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
