import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/site';

/**
 * Routes that should appear in search results.
 *
 * Deliberately excluded:
 *   /account/**  - behind auth, no public content (noindex via its layout)
 *   /activate/** - token-gated buddy activation links
 *   /redeem      - thin code-entry utility, marked noindex
 *   /upgrade     - a redirect to /#sign-up; redirecting URLs have no
 *                  business in a sitemap
 *
 * If any of those ever gains real indexable content, add it here.
 */
const PUBLIC_ROUTES: {
  path: string;
  changeFrequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  priority: number;
}[] = [
  { path: '/', changeFrequency: 'weekly', priority: 1 },
  { path: '/macrocalc', changeFrequency: 'monthly', priority: 0.8 },
  { path: '/certificate', changeFrequency: 'monthly', priority: 0.6 },
  { path: '/about', changeFrequency: 'monthly', priority: 0.6 },
  { path: '/privacy', changeFrequency: 'yearly', priority: 0.2 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return PUBLIC_ROUTES.map(({ path, changeFrequency, priority }) => ({
    url: `${SITE_URL}${path}`,
    lastModified,
    changeFrequency,
    priority,
  }));
}