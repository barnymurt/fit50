// Data extracted from the standalone HTML pages, restructured for FIT50
// Each module has the data + a generic card-rendering helper

// ----- DRINKS -----
export interface Drink {
  n: number;
  name: string;
  kcal: string;
  servings: number;
  size: string;
  effort: string;
  keeps: string;
  blurb: string;
  ingredients: string[];
  method: string[];
  macros?: { c: number; p: number; f: number };
  batch_note?: string;
  flavour: string[];
  occasions: string[];
}

export const DRINK_FLAVOURS: Record<string, string> = {
  citrus: "Citrus & Zesty",
  berry: "Berry & Fruity",
  herbal: "Herbal & Green",
  warming: "Warming & Spiced",
  ginger: "Ginger & Sharp",
  tropical: "Tropical",
  coffee: "Coffee & Chocolate",
  creamy: "Creamy & Dessert-like",
  floral: "Tart & Floral"
};

export const DRINK_OCCASIONS: Record<string, string> = {
  everyday: "Everyday hydration",
  postworkout: "Post-workout",
  afternoon: "Afternoon pick-me-up",
  dinner: "Dinner mocktail",
  party: "Party / celebration",
  cosy: "Cosy evening",
  dessert: "Dessert replacement",
  batch: "Batch & top up"
};

// Subset of 50 drinks with key data. (Full data in the original HTML)
export const DRINKS: Drink[] = [
  { n: 1, name: "Lemon–Mint Cooler", kcal: "5–10", servings: 4, size: "250 ml", effort: "5 min + chill", keeps: "3 days refrigerated", blurb: "Fresh mint and citrus. As close to free calories as drinks get.", ingredients: ["1 lemon, sliced", "1 large handful fresh mint", "1 L cold water", "Ice", "Zero-calorie sweetener (optional)"], method: ["Muddle the mint lightly.", "Add lemon and water to a jug.", "Refrigerate 2–4 hours; strain if you prefer a clean serve.", "Top up with 250–500 ml water as the infusion gets stronger."], flavour: ["citrus","herbal"], occasions: ["everyday"] },
  { n: 2, name: "Cucumber Lime Water", kcal: "5", servings: 4, size: "250 ml", effort: "3 min + chill", keeps: "2–3 days refrigerated", blurb: "Cool, clean, impossible to overthink. Spa-water simple.", ingredients: ["½ cucumber, thinly sliced", "1 lime, sliced", "1 L water", "Fresh mint (optional)"], method: ["Combine everything in a jug.", "Refrigerate for 2–4 hours before serving.", "Remove cucumber after ~24 hours for best flavour."], flavour: ["citrus","herbal"], occasions: ["everyday"] },
  { n: 3, name: "Raspberry & Lime Infusion", kcal: "10", servings: 4, size: "250 ml", effort: "2 min + overnight", keeps: "3 days refrigerated", blurb: "Overnight jug of frozen raspberries and lime. Pink and cheap.", ingredients: ["75 g frozen raspberries", "1 lime, sliced", "1 L water", "Mint (optional)"], method: ["Add everything to a jug.", "Refrigerate overnight.", "Serve over ice. Frozen berries make this particularly cheap."], flavour: ["berry","citrus"], occasions: ["everyday"] },
  { n: 5, name: "Ginger Lemon Water", kcal: "5", servings: 4, size: "250 ml", effort: "15 min + cool", keeps: "4–5 days refrigerated", blurb: "One pot, four days. The workhorse batch drink.", ingredients: ["20–30 g fresh ginger, sliced", "1 lemon", "1 L water"], method: ["Simmer the ginger in ~500 ml water for 10 minutes.", "Cool, then add lemon juice.", "Top up with cold water to reach 1 L.", "Dilute further to taste."], flavour: ["ginger","citrus"], occasions: ["batch","postworkout"] },
  { n: 6, name: "Iced Green Tea & Lemon", kcal: "2", servings: 4, size: "250 ml", effort: "5 min + cool", keeps: "3–4 days refrigerated", blurb: "Two calories. Bottomless. The everyday default.", ingredients: ["3 green tea bags", "1 L water", "½ lemon", "Ice", "Zero-calorie sweetener (optional)"], method: ["Steep tea in hot water for 3–4 minutes.", "Cool completely.", "Add lemon and refrigerate. Serve over ice."], flavour: ["herbal","citrus"], occasions: ["everyday"] },
  { n: 7, name: "Peach Iced Tea", kcal: "10–15", servings: 4, size: "250 ml", effort: "5 min + overnight", keeps: "3–4 days refrigerated", blurb: "Frozen peach does the heavy lifting. No sugar syrup required.", ingredients: ["3 black tea bags", "100 g frozen peach", "1 L water", "Zero-calorie sweetener (optional)"], method: ["Brew the tea in hot water.", "Add frozen peach while cooling — it releases flavour as it thaws.", "Refrigerate overnight, then strain and serve."], flavour: ["tropical","herbal"], occasions: ["afternoon"] },
  { n: 10, name: "Orange–Ginger Spritz", kcal: "15–20", servings: 4, size: "250 ml", effort: "12 min + cool", keeps: "Base 4 days; fizz fresh", blurb: "Just enough OJ for flavour; ginger for the kick; fizz to finish.", ingredients: ["50 ml orange juice", "20 g fresh ginger", "750 ml water", "250 ml sparkling water", "Orange slices"], method: ["Make a ginger tea with 250 ml hot water; cool.", "Combine with orange juice and the remaining still water.", "Add sparkling water when serving. Garnish with orange."], batch_note: "Keep the base ready in the fridge; carbonate glass by glass.", flavour: ["citrus","ginger"], occasions: ["postworkout"] },
  { n: 11, name: "Lime & Ginger Cordial", kcal: "5–10", servings: 8, size: "60 ml concentrate", effort: "15 min + cool", keeps: "5 days refrigerated", blurb: "One batch, a week of drinks. Top up 60 ml with water and go.", ingredients: ["Juice of 3 limes", "30 g fresh ginger, sliced", "400 ml water", "Zero-calorie sweetener to taste"], method: ["Simmer ginger in the water for 10 minutes.", "Cool and strain.", "Stir in lime juice and sweetener.", "Serve 50–60 ml concentrate topped with 200–300 ml water or fizz."], batch_note: "Best make-once, top-up-all-week option in the collection.", flavour: ["citrus","ginger"], occasions: ["batch"] },
  { n: 15, name: "Raspberry Lemon Iced Tea", kcal: "10–15", servings: 4, size: "250 ml", effort: "5 min + overnight", keeps: "3–4 days refrigerated", blurb: "Black tea plus frozen raspberries. Overnight in the fridge.", ingredients: ["3 black tea bags", "75 g frozen raspberries", "½ lemon", "1 L water"], method: ["Brew the tea in hot water.", "Add raspberries while cooling.", "Stir in lemon.", "Refrigerate overnight and strain to serve."], flavour: ["berry","citrus"], occasions: ["afternoon"] },
  { n: 21, name: "No-Sugar Mojito", kcal: "10", servings: 1, size: "250 ml", effort: "3 min", keeps: "Best fresh", blurb: "Muddle, ice, fizz. A mojito that doesn't cost you the evening.", ingredients: ["½ lime, cut into wedges", "8–10 mint leaves", "1–2 tsp zero-calorie sweetener", "200–250 ml sparkling water", "Ice"], method: ["Muddle lime, mint and sweetener in a glass.", "Add ice.", "Top with sparkling water and stir gently."], batch_note: "Add 30–50 ml of the Lime & Ginger Cordial (No. 11) for an upgraded version.", flavour: ["herbal","citrus"], occasions: ["party"] },
  { n: 23, name: "Virgin Margarita", kcal: "15–20", servings: 1, size: "250 ml", effort: "3 min", keeps: "Best fresh", blurb: "Salt rim, lime, sparkling. Tastes far more cocktail than mock.", ingredients: ["30 ml fresh lime juice", "15 ml lemon juice", "100–150 ml sparkling water", "Salt for rim", "Ice", "Zero-calorie sweetener (optional)"], method: ["Salt the rim of your glass.", "Shake lime, lemon and sweetener with ice.", "Pour into the glass over fresh ice.", "Top with sparkling water."], flavour: ["citrus"], occasions: ["party","dinner"] },
  { n: 35, name: "Virgin Piña Colada", kcal: "50–60", servings: 1, size: "300 ml", effort: "3 min", keeps: "Best fresh", macros: { c: 4, p: 1, f: 4 }, blurb: "Blended coconut milk and pineapple. Creamy, tropical, actually macro-manageable.", ingredients: ["50 ml pineapple juice", "50 ml unsweetened coconut milk", "100 ml cold water", "Lime juice", "Ice", "Zero-calorie sweetener (optional)"], method: ["Add everything to a blender with ice.", "Blend until frothy.", "Pour into a glass and garnish with a lime wedge."], flavour: ["tropical","creamy"], occasions: ["party"] },
  { n: 37, name: "Iced Vanilla Latte", kcal: "30–50", servings: 1, size: "250 ml", effort: "3 min", keeps: "Best fresh", macros: { c: 2, p: 1, f: 3 }, blurb: "Espresso, almond milk, vanilla, salt. Coffee-shop sweetness, none of the sugar.", ingredients: ["1–2 espresso shots", "150 ml unsweetened almond milk", "½ tsp vanilla extract", "Zero-calorie sweetener", "Tiny pinch of salt", "Ice"], method: ["Combine everything in a shaker with ice.", "Shake vigorously until cold and frothy.", "Pour over fresh ice."], batch_note: "Salt makes the coffee taste sweeter without adding sugar.", flavour: ["coffee"], occasions: ["afternoon"] },
  { n: 38, name: "Mocha Protein Iced Coffee", kcal: "80–120", servings: 1, size: "300 ml", effort: "4 min", keeps: "Best fresh", macros: { c: 5, p: 12, f: 3 }, blurb: "Coffee that hits your protein target. Blender required.", ingredients: ["1 espresso or 100 ml strong coffee", "100 ml unsweetened almond milk", "½ scoop chocolate or vanilla protein powder", "1 tsp cocoa powder", "Ice", "Sweetener if needed"], method: ["Add everything to a blender.", "Blend until smooth.", "Pour over ice."], batch_note: "One of the few drinks here where protein becomes part of your macro strategy, not just flavour.", flavour: ["coffee","creamy"], occasions: ["postworkout"] },
  { n: 43, name: "Chocolate Mint Shake", kcal: "60–80", servings: 1, size: "300 ml", effort: "3 min", keeps: "Best fresh", macros: { c: 4, p: 10, f: 2 }, blurb: "Dessert replacement, actual protein. Blend it thick.", ingredients: ["150 ml unsweetened almond milk", "1 tsp cocoa powder", "2–3 drops mint extract", "½ scoop protein powder", "Ice", "Zero-calorie sweetener"], method: ["Add everything to a blender.", "Blend until thick and cold.", "Pour into a glass."], batch_note: "Particularly useful when the craving is for something sweet rather than something thirst-quenching.", flavour: ["coffee","creamy"], occasions: ["dessert","postworkout"] },
  { n: 50, name: "Espresso Tonic", kcal: "5–10", servings: 1, size: "250 ml", effort: "1 min", keeps: "Best fresh", blurb: "Espresso poured over tonic and ice. Thirty seconds; looks like a cocktail.", ingredients: ["1–2 espresso shots", "150–200 ml zero-sugar tonic water", "Strip of orange or lemon peel", "Lots of ice"], method: ["Fill a tall glass with ice.", "Pour in the tonic water.", "Slowly pour the espresso over the top.", "Twist the citrus peel over the drink and drop it in."], flavour: ["coffee","floral"], occasions: ["afternoon"] }
];

// ----- QUIT SERVICES (smoking cessation) -----
export interface QuitService {
  n: number;
  region: string;
  name: string;
  org: string;
  country: string;
  blurb: string;
  website: string | null;
  phone: string | null;
  languages: string[];
  support: string[];
  cost: string;
  notes?: string;
}

export const QUIT_REGIONS: Record<string, { label: string; blurb: string }> = {
  europe:        { label: "Europe", blurb: "Most European services are free at the point of use through national health systems." },
  north_america: { label: "North America", blurb: "The US and Canada route callers through a single toll-free number to state or provincial support." },
  south_america: { label: "South America", blurb: "Brazil and Uruguay lead the region; several countries offer free cessation medication through public health." },
  africa:        { label: "Africa", blurb: "Only a handful of African countries run national toll-free quitlines; South Africa's is the region's longest-running." },
  asia:          { label: "Asia", blurb: "Government-backed cessation portals dominate, often paired with subsidised clinic visits." },
  oceania:       { label: "Oceania", blurb: "Australia and New Zealand run mature national programmes with interpreter support." }
};

export const QUIT_SUPPORT: Record<string, string> = {
  phone:  "Phone line",
  online: "Online programme",
  app:    "App",
  text:   "Text / SMS",
  clinic: "Clinic network"
};

export const QUIT_SERVICES: QuitService[] = [
  { n: 1, region: "europe", name: "NHS Better Health", org: "National Health Service", country: "United Kingdom", blurb: "Personal Quit Plan builder, free NHS Quit Smoking app, and daily email support for the first 28 days.", website: "https://www.nhs.uk/better-health/quit-smoking/", phone: null, languages: ["English"], support: ["online", "app"], cost: "Free" },
  { n: 2, region: "europe", name: "Smokefree National Helpline", org: "NHS England", country: "United Kingdom", blurb: "Trained advisers on the phone and via online chat, with tailored tools depending on how much you smoke.", website: "https://www.nhs.uk/live-well/quit-smoking/", phone: "0300 123 1044", languages: ["English"], support: ["phone", "online"], cost: "Free", notes: "Open Mon–Fri 9am–8pm, Sat–Sun 11am–4pm." },
  { n: 3, region: "europe", name: "Linha Deixar de Fumar", org: "SNS 24", country: "Portugal", blurb: "The national health line's dedicated smoking-cessation route. Free counselling and referral to a consulta de cessação tabágica.", website: "https://www.sns24.gov.pt/", phone: "808 24 24 24", languages: ["Portuguese"], support: ["phone", "clinic"], cost: "Free" },
  { n: 5, region: "europe", name: "HSE Quit", org: "Health Service Executive", country: "Ireland", blurb: "Ireland's national quit programme: free plan, tracking app, and one-to-one adviser support.", website: "https://www2.hse.ie/quit-smoking/", phone: "1800 201 203", languages: ["English"], support: ["phone", "online", "app", "text"], cost: "Free" },
  { n: 6, region: "europe", name: "Tabac Info Service", org: "Santé publique France", country: "France", blurb: "France's national cessation site, app, and free tobacco-adviser coaching by phone.", website: "https://www.tabac-info-service.fr/", phone: "39 89", languages: ["French"], support: ["phone", "online", "app"], cost: "Free" },
  { n: 9, region: "north_america", name: "Smokefree.gov", org: "National Cancer Institute", country: "United States", blurb: "NCI-run hub with quit plans, the SmokefreeTXT text programme, the quitSTART app, and tailored paths for women, veterans, teens.", website: "https://smokefree.gov/", phone: "1-800-QUIT-NOW (784-8669)", languages: ["English", "Spanish"], support: ["phone", "online", "app", "text"], cost: "Free" },
  { n: 11, region: "north_america", name: "Smokers' Helpline", org: "Canadian Cancer Society", country: "Canada", blurb: "National toll-free line and web platform. Routes callers to provincial services and free NRT where available.", website: "https://www.smokershelpline.ca/", phone: "1-866-366-3667", languages: ["English", "French"], support: ["phone", "online", "text"], cost: "Free" },
  { n: 16, region: "south_america", name: "Programa Nacional de Controle do Tabagismo", org: "INCA", country: "Brazil", blurb: "Brazil's SUS-integrated national cessation programme. Free behavioural counselling plus NRT, varenicline, or bupropion at no cost.", website: "https://www.gov.br/inca/", phone: "136 (Disque Saúde)", languages: ["Portuguese"], support: ["phone", "clinic"], cost: "Free" },
  { n: 18, region: "south_america", name: "Programa Nacional de Control del Tabaco", org: "Ministerio de Salud", country: "Argentina", blurb: "Argentina's national tobacco control programme runs a free helpline and a network of accredited cessation clinics.", website: "https://www.argentina.gob.ar/salud/tabaco", phone: "0800-222-1002 (opción 6)", languages: ["Spanish"], support: ["phone", "clinic"], cost: "Free" },
  { n: 21, region: "south_america", name: "Programa Nacional para el Control del Tabaco", org: "Ministerio de Salud Pública", country: "Uruguay", blurb: "One of Latin America's strongest tobacco control regimes. Free cessation medication, subsidised NRT.", website: "https://www.gub.uy/ministerio-salud-publica/", phone: "0800 7070", languages: ["Spanish"], support: ["phone", "clinic"], cost: "Free", notes: "Uruguay was the first country to implement all WHO FCTC demand-reduction measures." },
  { n: 23, region: "africa", name: "eKickButt", org: "CANSA", country: "South Africa", blurb: "Free online cessation programme delivered by email over several weeks. Mentors you as non-smoking becomes habit.", website: "https://cansa.org.za/how-to-quit-smoking-and-why/", phone: "0800 22 6622", languages: ["English", "Afrikaans"], support: ["online", "phone"], cost: "Free" },
  { n: 24, region: "africa", name: "National Council Against Smoking Quitline", org: "NCAS", country: "South Africa", blurb: "South Africa's longest-running Quitline. Number printed on every tobacco package in the country.", website: "https://againstsmoking.org.za/", phone: "011 720 3145", languages: ["English", "Afrikaans", "Zulu"], support: ["phone", "online"], cost: "Standard call rate" },
  { n: 29, region: "asia", name: "I Quit — 28-Day Countdown", org: "Health Promotion Board", country: "Singapore", blurb: "HPB's structured 28-day online programme, backed by trained coaches on QuitLine. Free NRT starter kits available.", website: "https://www.healthhub.sg/programmes/iquit", phone: "1800 438 2000", languages: ["English", "Mandarin", "Malay", "Tamil"], support: ["phone", "online"], cost: "Free" },
  { n: 34, region: "asia", name: "mQuit", org: "Kementerian Kesihatan Malaysia", country: "Malaysia", blurb: "Malaysia's national cessation service and clinic locator. Free counselling at government facilities under the NRT programme.", website: "https://jomquit.moh.gov.my/", phone: null, languages: ["Malay", "English"], support: ["online", "clinic"], cost: "Free" },
  { n: 35, region: "asia", name: "Nosmoke", org: "KHEPI", country: "South Korea", blurb: "Korea's national cessation service: helpline, mobile counselling, and a nationwide network of smoking cessation clinics with subsidised medication.", website: "https://nosmk.khepi.or.kr/", phone: "1544-9030", languages: ["Korean"], support: ["phone", "clinic"], cost: "Free" },
  { n: 36, region: "oceania", name: "Quit — Quitline", org: "Cancer Council Victoria", country: "Australia", blurb: "Australia's national cessation programme. Free tailored phone counselling with interpreter support, plus the My QuitBuddy app.", website: "https://www.quit.org.au/", phone: "13 78 48", languages: ["English"], support: ["phone", "online", "app"], cost: "Free" },
  { n: 38, region: "oceania", name: "Quitline — Me Mutu", org: "Whakarongorau Aotearoa", country: "New Zealand", blurb: "Free phone and text-based counselling, plus access to subsidised NRT (patches, gum, lozenges) shipped to your door.", website: "https://quit.org.nz/", phone: "0800 778 778", languages: ["English"], support: ["phone", "text", "online"], cost: "Free" }
];

// ----- MEDITATION APPS -----
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

export const MEDITATION_CATEGORIES: Record<string, { label: string; blurb: string }> = {
  free: { label: "Free", blurb: "Fully usable without paying — non-profit, university-backed, or with a genuinely functional free tier." },
  premium: { label: "Premium", blurb: "Subscription-based with the strongest 10-minute daily programming and structured courses. Most offer a free trial." }
};

export const MEDITATION_FEATURES: Record<string, string> = {
  beginner: "Beginner-friendly",
  daily: "Daily 10-min",
  courses: "Structured courses",
  sleep: "Sleep",
  anxiety: "Anxiety",
  timer: "Timer / unguided",
  secular: "Secular / philosophy"
};

export const MEDITATION_APPS: MeditationApp[] = [
  { n: 1, category: 'free', name: "Insight Timer", org: "Insight Network Inc.", price: "Free (Member Plus ~$69.99/yr optional)", blurb: "The largest free meditation library — 200,000+ guided sessions from 10,000+ teachers, plus one of the best silent-meditation timers going.", website: "https://insighttimer.com/", platforms: ["iOS", "Android", "Web"], features: ["timer", "beginner", "anxiety", "sleep"], best_for: "Anyone who wants variety, and experienced meditators who mostly want a good timer with bells." },
  { n: 2, category: 'free', name: "Smiling Mind", org: "Smiling Mind (Australian not-for-profit)", price: "Free forever", blurb: "Fully free, no premium tier, no ads. Built by Australian psychologists with age-specific programmes from age 3 to adult. Sessions are typically 5–15 minutes.", website: "https://www.smilingmind.com.au/", platforms: ["iOS", "Android", "Web"], features: ["beginner", "daily", "anxiety"], best_for: "Households — genuinely usable content for kids alongside adult programmes." },
  { n: 3, category: 'free', name: "UCLA Mindful", org: "UCLA Mindful Awareness Research Center", price: "Free", blurb: "The university's public meditation app, drawn from decades of MARC clinical practice. Short guided sessions of 3–19 minutes, in English and Spanish.", website: "https://www.uclahealth.org/programs/marc/free-guided-meditations", platforms: ["iOS", "Android", "Web"], features: ["beginner", "anxiety", "secular"], best_for: "People who want an academic, non-commercial voice with clinical credibility." },
  { n: 4, category: 'free', name: "Medito", org: "Medito Foundation (non-profit)", price: "Free forever, no ads, no premium", blurb: "A registered non-profit built to keep meditation free. Guided sessions on stress, sleep, focus, and grief, plus a timer with interval bells.", website: "https://meditofoundation.org/", platforms: ["iOS", "Android", "Web"], features: ["beginner", "sleep", "anxiety", "timer"], best_for: "Anyone allergic to the freemium sales funnel of Calm and Headspace." },
  { n: 5, category: 'premium', name: "Headspace", org: "Headspace Inc.", price: "$12.99/month or $69.99/year — 14-day free trial", blurb: "The most structured onboarding in the category. The Basics course teaches one technique at a time. Every session lets you pick 10, 15 or 20 minutes.", website: "https://www.headspace.com/", platforms: ["iOS", "Android", "Web"], features: ["beginner", "courses", "daily", "sleep"], best_for: "Complete beginners who want a curriculum rather than a buffet." },
  { n: 6, category: 'premium', name: "Calm", org: "Calm.com Inc.", price: "$12.99/month or $69.99/year — 7-day free trial", blurb: "Best-in-class 10-minute daily session. The Daily Calm changes every day, and Daily Trips are always around 10 minutes with stress-management guidance.", website: "https://www.calm.com/", platforms: ["iOS", "Android", "Web"], features: ["daily", "sleep", "anxiety", "beginner"], best_for: "People whose main pain point is sleep, or who want a fresh 10-minute session waiting each day." },
  { n: 7, category: 'premium', name: "Waking Up", org: "Sam Harris", price: "$99.99/year — 7-day free trial — free scholarship on request", blurb: "Sam Harris's secular, philosophy-led path. Lessons run around 10 minutes and cover both practical mindfulness and deeper theory.", website: "https://www.wakingup.com/", platforms: ["iOS", "Android", "Web"], features: ["secular", "courses", "daily"], best_for: "Experienced meditators, and anyone who wants meditation stripped of woo." },
  { n: 8, category: 'premium', name: "Ten Percent Happier", org: "Ten Percent Happier", price: "~$99.99/year — limited free tier", blurb: "Grew out of the ABC news anchor's book of the same name. Structured courses with sessions typically in the 5–15 minute range.", website: "https://www.tenpercent.com/", platforms: ["iOS", "Android", "Web"], features: ["courses", "beginner", "anxiety", "secular"], best_for: "Skeptics — the tone is 'meditation for people who think meditation is silly'." }
];
