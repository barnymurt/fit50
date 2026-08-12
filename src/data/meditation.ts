export interface MeditationApp {
  n: number;
  category: 'free' | 'premium';
  name: string;
  org: string;
  price: string;
  blurb: string;
  website: string;
  platforms: string[];
  features: string[];
  best_for: string;
  notes?: string;
}

export const MEDITATION_CATEGORIES: Record<MeditationApp['category'], { label: string; blurb: string }> = {
  free:    { label: 'Free',    blurb: 'Fully usable without paying — either non-profit, university-backed, or with a genuinely functional free tier.' },
  premium: { label: 'Premium', blurb: 'Subscription-based with the strongest 10-minute daily programming and structured courses. Most offer a free trial before you commit.' },
};

export const MEDITATION_FEATURES: Record<string, string> = {
  beginner: 'Beginner-friendly',
  daily:    'Daily 10-min',
  courses:  'Structured courses',
  sleep:    'Sleep',
  anxiety:  'Anxiety',
  timer:    'Timer / unguided',
  secular:  'Secular / philosophy',
};

export const MEDITATION_APPS: MeditationApp[] = [
  { n: 1, category: 'free',    name: 'Insight Timer',           org: 'Insight Network Inc.',                  price: 'Free (Member Plus ~$69.99/yr optional)', blurb: 'The largest free meditation library on the planet — 200,000+ guided sessions from 10,000+ teachers, plus one of the best silent-meditation timers going. Filter by length to find plenty of 10-minute sessions.', website: 'https://insighttimer.com/',                              platforms: ['iOS','Android','Web'], features: ['timer','beginner','anxiety','sleep'], best_for: 'Anyone who wants variety, and experienced meditators who mostly want a good timer with bells.' },
  { n: 2, category: 'free',    name: 'Smiling Mind',             org: 'Smiling Mind (Australian not-for-profit)', price: 'Free forever',                            blurb: 'Fully free, no premium tier, no ads. Built by Australian psychologists with age-specific programmes from age 3 to adult. Sessions are typically 5–15 minutes — ideal for the 10-minute slot.',                                       website: 'https://www.smilingmind.com.au/',                          platforms: ['iOS','Android','Web'], features: ['beginner','daily','anxiety'],          best_for: 'Households — genuinely usable content for kids alongside adult programmes.' },
  { n: 3, category: 'free',    name: 'UCLA Mindful',             org: 'UCLA Mindful Awareness Research Center',  price: 'Free',                                     blurb: 'The university’s public meditation app, drawn from decades of MARC clinical practice. Short guided sessions of 3–19 minutes, in English and Spanish, with a fair chunk sitting right in the 10-minute range.',                website: 'https://www.uclahealth.org/programs/marc/free-guided-meditations', platforms: ['iOS','Android','Web'], features: ['beginner','anxiety','secular'],       best_for: 'People who want an academic, non-commercial voice with clinical credibility.' },
  { n: 4, category: 'free',    name: 'Medito',                   org: 'Medito Foundation (non-profit)',          price: 'Free forever, no ads, no premium',         blurb: 'A registered non-profit built to keep meditation free. Guided sessions on stress, sleep, focus, and grief, plus a timer with interval bells. Deliberately simple design — no upsell surface at all.',                       website: 'https://meditofoundation.org/',                            platforms: ['iOS','Android','Web'], features: ['beginner','sleep','anxiety','timer'], best_for: 'Anyone allergic to the freemium sales funnel of Calm and Headspace.' },
  { n: 5, category: 'premium', name: 'Headspace',                org: 'Headspace Inc. (co-founded by Andy Puddicombe)', price: '$12.99/month or $69.99/year — 14-day free trial', blurb: 'The most structured onboarding in the category. The Basics course teaches one technique at a time with short animations explaining the concept. Every session lets you pick 10, 15 or 20 minutes.', website: 'https://www.headspace.com/',                                 platforms: ['iOS','Android','Web'], features: ['beginner','courses','daily','sleep'], best_for: 'Complete beginners who want a curriculum rather than a buffet.', notes: 'One Oxford-published study found 10 days of use reduced mind-wandering by 32%. Andy is still the dominant voice, which some love and some tire of.' },
  { n: 6, category: 'premium', name: 'Calm',                     org: 'Calm.com Inc.',                          price: '$12.99/month or $69.99/year — 7-day free trial', blurb: 'Best-in-class 10-minute daily session. The Daily Calm changes every day, and Daily Trips are always around 10 minutes with stress-management guidance. Also the strongest sleep content on any app.', website: 'https://www.calm.com/',                                      platforms: ['iOS','Android','Web'], features: ['daily','sleep','anxiety','beginner'],  best_for: 'People whose main pain point is sleep, or who want a fresh 10-minute session waiting each day.', notes: 'Sleep Stories narrated by Matthew McConaughey and Harry Styles are surprisingly effective. A lifetime membership is also sold for $499.99.' },
  { n: 7, category: 'premium', name: 'Waking Up',                org: 'Sam Harris',                              price: '$99.99/year — 7-day free trial — free scholarship on request', blurb: 'Sam Harris’s secular, philosophy-led path. Lessons run around 10 minutes and cover both practical mindfulness and deeper theory. Not a buffet — you’re put on a sequential path.', website: 'https://www.wakingup.com/',                                 platforms: ['iOS','Android','Web'], features: ['secular','courses','daily'],          best_for: 'Experienced meditators, and anyone who wants meditation stripped of woo.', notes: 'Harris publicly offers free access to anyone who genuinely can’t afford it — email support and ask.' },
  { n: 8, category: 'premium', name: 'Ten Percent Happier',      org: 'Ten Percent Happier (founded by Dan Harris)', price: '~$99.99/year — limited free tier',         blurb: 'Grew out of the ABC news anchor’s book of the same name. Structured courses with sessions typically in the 5–15 minute range and a strong bench of teachers (Joseph Goldstein, Sharon Salzberg, Jeff Warren).', website: 'https://www.tenpercent.com/',                                 platforms: ['iOS','Android','Web'], features: ['courses','beginner','anxiety','secular'], best_for: 'Skeptics — the tone is ‘meditation for people who think meditation is silly’.' },
];
