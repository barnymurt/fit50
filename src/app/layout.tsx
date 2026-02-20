import type { Metadata } from "next";
import { Space_Grotesk, Titan_One } from "next/font/google";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const titanOne = Titan_One({
  variable: "--font-display",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: "FIT50 - 50-Day Fitness Challenge",
  description: "50 Days. 9 Daily Tasks. 1 Life-Changing Habit. Build unbreakable habits with the FIT50 fitness challenge.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${spaceGrotesk.variable} ${titanOne.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
