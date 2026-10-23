import type { Metadata } from 'next';

/**
 * Everything under /account is behind auth and has no crawlable content.
 * This keeps personal dashboards, trackers and logs out of search results.
 * /robots.txt also disallows the path, but a noindex meta tag is what
 * actually guarantees exclusion once a URL has been crawled.
 */
export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export default function AccountLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <>{children}</>;
}