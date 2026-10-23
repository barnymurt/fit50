import type { Metadata } from "next";
import { Fraunces, Inter, Lilita_One } from "next/font/google";
import { SITE_DESCRIPTION, SITE_NAME, SITE_TITLE, SITE_URL } from "@/lib/site";
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
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_TITLE,
    template: `%s · ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  openGraph: {
    type: 'website',
    siteName: SITE_NAME,
    locale: 'en_GB',
    url: SITE_URL,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: [
      {
        url: '/og/fit50-og-ink-1200x630.png',
        width: 1200,
        height: 630,
        alt: 'FIT50 Challenge — 50 days. 9 habits. 1 fresh start.',
      },
      {
        url: '/og/fit50-og-paper-1200x630.png',
        width: 1200,
        height: 630,
        alt: 'FIT50 Challenge — 50 days. 9 habits. 1 fresh start.',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: ['/og/fit50-og-ink-1200x630.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  // No `alternates.canonical` here on purpose: a canonical set in the root
  // layout cascades to every child route, which would make /about, /macrocalc
  // and the rest all declare themselves as `/`. Canonicals are set per page.
};

// Links the site to its official social profile. `sameAs` is how search
// engines tie an entity to verified accounts, so it belongs here as well as
// in the footer.
const structuredData = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: SITE_NAME,
  url: SITE_URL,
  description: SITE_DESCRIPTION,
  sameAs: ["https://www.instagram.com/fit50challenge/"],
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
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
