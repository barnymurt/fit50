'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Fraunces, Inter } from 'next/font/google';

/* ============================================================
   Fonts — loaded via next/font, exposed as CSS custom properties
   ============================================================ */
const fraunces = Fraunces({
  subsets: ['latin'],
  weight: ['300', '400', '600', '700', '900'],
  style: ['normal', 'italic'],
  variable: '--ql-font-display',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--ql-font-body',
  display: 'swap',
});

/* ============================================================
   Taxonomy
   ============================================================ */
const REGIONS = {
  europe:        { label: 'Europe',        blurb: 'Most European services are free at the point of use through national health systems.' },
  north_america: { label: 'North America', blurb: 'The US and Canada route callers through a single toll-free number to state or provincial support.' },
  south_america: { label: 'South America', blurb: 'Brazil and Uruguay lead the region; several countries offer free cessation medication through public health.' },
  africa:        { label: 'Africa',        blurb: "Only a handful of African countries run national toll-free quitlines; South Africa's is the region's longest-running." },
  asia:          { label: 'Asia',          blurb: 'Government-backed cessation portals dominate, often paired with subsidised clinic visits.' },
  oceania:       { label: 'Oceania',       blurb: 'Australia and New Zealand run mature national programmes with interpreter support.' },
} as const;

const SUPPORT = {
  phone:  'Phone line',
  online: 'Online programme',
  app:    'App',
  text:   'Text / SMS',
  clinic: 'Clinic network',
} as const;

type RegionKey = keyof typeof REGIONS;
type SupportKey = keyof typeof SUPPORT;

interface Service {
  n: number;
  region: RegionKey;
  name: string;
  org: string;
  country: string;
  blurb: string;
  website: string | null;
  phone: string | null;
  languages: string[];
  support: SupportKey[];
  cost: string;
  notes: string | null;
}

/* ============================================================
   Data — 40 services
   ============================================================ */
const SERVICES: Service[] = [
  /* ===== EUROPE ===== */
  { n: 1, region: 'europe', name: 'NHS Better Health', org: 'National Health Service', country: 'United Kingdom', blurb: 'Personal Quit Plan builder, free NHS Quit Smoking app, and daily email support for the first 28 days.', website: 'https://www.nhs.uk/better-health/quit-smoking/', phone: null, languages: ['English'], support: ['online', 'app'], cost: 'Free', notes: 'Also connects you to local NHS Stop Smoking Services for face-to-face help.' },
  { n: 2, region: 'europe', name: 'Smokefree National Helpline', org: 'NHS England', country: 'United Kingdom', blurb: 'Trained advisers on the phone and via online chat, with tailored tools depending on how much you smoke.', website: 'https://www.nhs.uk/live-well/quit-smoking/', phone: '0300 123 1044', languages: ['English'], support: ['phone', 'online'], cost: 'Free', notes: 'Open Mon–Fri 9am–8pm, Sat–Sun 11am–4pm.' },
  { n: 3, region: 'europe', name: 'Linha Deixar de Fumar', org: 'SNS 24 · Serviço Nacional de Saúde', country: 'Portugal', blurb: "The national health line's dedicated smoking-cessation route. Free counselling and referral to a consulta de cessação tabágica at your local centro de saúde.", website: 'https://www.sns24.gov.pt/', phone: '808 24 24 24', languages: ['Portuguese'], support: ['phone', 'clinic'], cost: 'Free', notes: 'Pick the cessação tabágica option when the menu plays.' },
  { n: 4, region: 'europe', name: 'Fundação Portuguesa do Pulmão', org: 'Portuguese Lung Foundation', country: 'Portugal', blurb: 'Portuguese-language cessation campaigns, awareness resources, and a directory of respiratory specialists.', website: 'https://www.fundacaoportuguesadopulmao.org/', phone: null, languages: ['Portuguese'], support: ['online'], cost: 'Free', notes: 'Best used alongside SNS 24 for the clinical route.' },
  { n: 5, region: 'europe', name: 'HSE Quit', org: 'Health Service Executive', country: 'Ireland', blurb: "Ireland's national quit programme: free plan, tracking app, and one-to-one adviser support by phone, text, or webchat.", website: 'https://www2.hse.ie/quit-smoking/', phone: '1800 201 203', languages: ['English'], support: ['phone', 'online', 'app', 'text'], cost: 'Free', notes: 'Text QUIT to 50100 to start the SMS programme.' },
  { n: 6, region: 'europe', name: 'Tabac Info Service', org: 'Santé publique France', country: 'France', blurb: 'The national cessation site, app, and free tobacco-adviser (tabacologue) coaching by phone.', website: 'https://www.tabac-info-service.fr/', phone: '39 89', languages: ['French'], support: ['phone', 'online', 'app'], cost: 'Free (call charged as local)', notes: 'Open Mon–Sat 8am–8pm.' },
  { n: 7, region: 'europe', name: 'rauchfrei-info.de', org: 'BZgA · Federal Centre for Health Education', country: 'Germany', blurb: "Germany's federal cessation portal with a phone helpline, self-help exercises, and an online 'ausstiegs-programm'.", website: 'https://www.rauchfrei-info.de/', phone: '0800 8 31 31 31', languages: ['German'], support: ['phone', 'online'], cost: 'Free', notes: 'Callback service available if the line is busy.' },
  { n: 8, region: 'europe', name: 'Comité Nacional para la Prevención del Tabaquismo', org: 'CNPT', country: 'Spain', blurb: "Spain's national coordinating body for tobacco control. Resources, cessation guides, and links to autonomous-region programmes.", website: 'https://cnpt.es/', phone: null, languages: ['Spanish'], support: ['online', 'clinic'], cost: 'Free', notes: 'Regional health services (SESCAM, Osakidetza, etc.) run local cessation clinics.' },

  /* ===== NORTH AMERICA ===== */
  { n: 9, region: 'north_america', name: 'Smokefree.gov', org: 'National Cancer Institute', country: 'United States', blurb: 'NCI-run hub with quit plans, the SmokefreeTXT text programme, the quitSTART app, and tailored paths for women, veterans, teens, and Spanish speakers.', website: 'https://smokefree.gov/', phone: '1-800-QUIT-NOW (784-8669)', languages: ['English', 'Spanish'], support: ['phone', 'online', 'app', 'text'], cost: 'Free', notes: 'Text QUIT to 47848 to join SmokefreeTXT.' },
  { n: 10, region: 'north_america', name: 'Freedom From Smoking', org: 'American Lung Association', country: 'United States', blurb: 'A long-established structured cessation programme available online, as a self-help guide, or through group clinics.', website: 'https://www.lung.org/quit-smoking/', phone: '1-800-LUNGUSA (586-4872)', languages: ['English', 'Spanish'], support: ['phone', 'online', 'clinic'], cost: 'Free (some group clinics fee-based)', notes: 'Includes a specific track for people over 60.' },
  { n: 11, region: 'north_america', name: "Smokers' Helpline", org: 'Canadian Cancer Society', country: 'Canada', blurb: 'National toll-free line and web platform run in partnership with provincial governments. Routes callers to provincial services and free NRT where available.', website: 'https://www.smokershelpline.ca/', phone: '1-866-366-3667', languages: ['English', 'French', '+ others via interpreter'], support: ['phone', 'online', 'text'], cost: 'Free', notes: 'Text iQuit to 123456 to start the text programme.' },
  { n: 12, region: 'north_america', name: 'Break It Off', org: 'Health Canada', country: 'Canada', blurb: 'Federally-run cessation app and website aimed at younger smokers. Personalised quit plan, savings tracker, and craving tools.', website: 'https://www.canada.ca/en/health-canada/services/smoking-tobacco/quit-smoking.html', phone: null, languages: ['English', 'French'], support: ['online', 'app'], cost: 'Free', notes: 'Sits alongside provincial quitlines rather than replacing them.' },
  { n: 13, region: 'north_america', name: 'Línea de la Vida', org: 'CONADIC · Comisión Nacional contra las Adicciones', country: 'Mexico', blurb: "Mexico's national addictions line covers tobacco cessation alongside other substances. Referrals to CENADIC clinics for in-person treatment.", website: 'https://www.gob.mx/salud/conadic', phone: '800 911 2000', languages: ['Spanish'], support: ['phone', 'clinic'], cost: 'Free', notes: '24/7 line. Ask for the tabaquismo route.' },
  { n: 14, region: 'north_america', name: 'Déjelo Ya', org: 'Ministerio de Salud', country: 'Costa Rica', blurb: 'Costa Rica scores near the top in the Americas for cessation support. Toll-free counselling and access to public-health cessation medication.', website: 'https://www.ministeriodesalud.go.cr/', phone: '1-855-DÉJELO-YA (335-3569)', languages: ['Spanish'], support: ['phone', 'clinic'], cost: 'Free', notes: "Part of the country's WHO best-practice cessation implementation." },
  { n: 15, region: 'north_america', name: 'National Council on Drug Abuse', org: 'Government of Jamaica', country: 'Jamaica', blurb: "Jamaica's national drug prevention agency runs tobacco cessation counselling and community outreach programmes.", website: 'https://ncda.gov.jm/', phone: '888-991-4022', languages: ['English'], support: ['phone', 'clinic'], cost: 'Free', notes: 'Local health centres also offer group cessation support.' },

  /* ===== SOUTH AMERICA ===== */
  { n: 16, region: 'south_america', name: 'Programa Nacional de Controle do Tabagismo', org: 'INCA · Instituto Nacional de Câncer', country: 'Brazil', blurb: "Brazil's SUS-integrated national cessation programme. Free behavioural counselling plus NRT, varenicline, or bupropion at no cost to the patient.", website: 'https://www.gov.br/inca/', phone: '136 (Disque Saúde)', languages: ['Portuguese'], support: ['phone', 'clinic'], cost: 'Free', notes: 'Ask at any UBS (unidade básica de saúde) for enrolment.' },
  { n: 17, region: 'south_america', name: 'Pare de Fumar Conosco', org: 'INCA', country: 'Brazil', blurb: 'Interactive web decision-making tool combining animations and audio to guide smokers through readiness, planning, and treatment choice.', website: 'https://www.inca.gov.br/programa-nacional-de-controle-do-tabagismo', phone: null, languages: ['Portuguese'], support: ['online'], cost: 'Free', notes: 'Designed to be usable at low literacy levels.' },
  { n: 18, region: 'south_america', name: 'Programa Nacional de Control del Tabaco', org: 'Ministerio de Salud', country: 'Argentina', blurb: "Argentina's national tobacco control programme runs a free helpline and a network of accredited cessation clinics in public hospitals.", website: 'https://www.argentina.gob.ar/salud/tabaco', phone: '0800-222-1002 (opción 6)', languages: ['Spanish'], support: ['phone', 'clinic'], cost: 'Free', notes: 'Consulta the map on the site for your nearest cessation service.' },
  { n: 19, region: 'south_america', name: 'Chile Libre de Tabaco', org: 'MINSAL · Ministerio de Salud', country: 'Chile', blurb: "MINSAL's cessation programme routes callers through the national Salud Responde line and offers group and individual support at primary care centres.", website: 'https://www.minsal.cl/', phone: '600 360 7777 (Salud Responde)', languages: ['Spanish'], support: ['phone', 'clinic'], cost: 'Free', notes: 'Ask for the programa de cesación tabáquica when connected.' },
  { n: 20, region: 'south_america', name: 'Línea Antitabaco', org: 'MINSA · Ministerio de Salud', country: 'Peru', blurb: "Peru's national tobacco cessation line, supported by MINSA and text-based cessation pilots in Lima.", website: 'https://www.gob.pe/minsa', phone: '1-877-335-2567', languages: ['Spanish', 'Quechua'], support: ['phone'], cost: 'Free', notes: "MINSA's WHO MPOWER score for cessation is 4/5." },
  { n: 21, region: 'south_america', name: 'Programa Nacional para el Control del Tabaco', org: 'Ministerio de Salud Pública', country: 'Uruguay', blurb: "One of Latin America's strongest tobacco control regimes. Free cessation medication, subsidised NRT, and a network of trained health workers.", website: 'https://www.gub.uy/ministerio-salud-publica/', phone: '0800 7070', languages: ['Spanish'], support: ['phone', 'clinic'], cost: 'Free', notes: 'Uruguay was the first country to implement all WHO FCTC demand-reduction measures.' },
  { n: 22, region: 'south_america', name: 'Línea 171 · Opción 2', org: 'Ministerio de Salud Pública', country: 'Ecuador', blurb: "MSP's cessation route sits behind option 2 of the national health line. Referrals to public-health cessation groups.", website: 'https://www.salud.gob.ec/', phone: '171 (opción 2)', languages: ['Spanish'], support: ['phone', 'clinic'], cost: 'Free', notes: "Listed by WHO in the PAHO region's cessation directory." },

  /* ===== AFRICA ===== */
  { n: 23, region: 'africa', name: 'eKickButt', org: 'CANSA · Cancer Association of South Africa', country: 'South Africa', blurb: 'Free online cessation programme delivered by email over several weeks, with surveys, guides, and downloads. Mentors you as non-smoking becomes habit.', website: 'https://cansa.org.za/how-to-quit-smoking-and-why/', phone: '0800 22 6622', languages: ['English', 'Afrikaans'], support: ['online', 'phone'], cost: 'Free', notes: 'Text-only support: 072 197 9305 (English/Afrikaans), 071 867 3530 (isiXhosa, isiZulu, Sesotho, Setswana, Sepedi).' },
  { n: 24, region: 'africa', name: 'National Council Against Smoking Quitline', org: 'NCAS', country: 'South Africa', blurb: "South Africa's longest-running Quitline (25+ years). Number printed on every tobacco package in the country. Downloadable guides in three languages.", website: 'https://againstsmoking.org.za/', phone: '011 720 3145', languages: ['English', 'Afrikaans', 'Zulu'], support: ['phone', 'online'], cost: 'Standard call rate (not toll-free)', notes: 'Email: quit@iafrica.com. Backed by the WHO African region.' },
  { n: 25, region: 'africa', name: 'WHO Africa · Tobacco Control', org: 'World Health Organization Regional Office for Africa', country: 'Regional', blurb: "Regional hub with country-by-country tobacco control resources, cessation programme directories, and referrals for African nations without a national quitline.", website: 'https://www.afro.who.int/health-topics/tobacco', phone: null, languages: ['English', 'French', 'Portuguese'], support: ['online'], cost: 'Free', notes: 'Useful when a country has no toll-free quitline of its own — most SSA countries.' },
  { n: 26, region: 'africa', name: 'Tobacco Control Board', org: 'Ministry of Health', country: 'Kenya', blurb: "Kenya's MOH runs a network of accredited tobacco use disorder treatment centres across 13 counties, alongside cessation guidelines for health workers.", website: 'https://www.health.go.ke/', phone: null, languages: ['English', 'Swahili'], support: ['clinic'], cost: 'Consultation fees vary', notes: '71% of Kenyan smokers plan to quit at some point but access to formal cessation support is limited.' },
  { n: 27, region: 'africa', name: 'National Tobacco Control Programme', org: 'Federal Ministry of Health', country: 'Nigeria', blurb: "Nigeria's FMOH tobacco control unit coordinates cessation efforts alongside the National Tobacco Control Act. Referrals to teaching hospitals for treatment.", website: 'https://www.health.gov.ng/', phone: null, languages: ['English'], support: ['clinic'], cost: 'Public hospital rates', notes: 'No national toll-free quitline yet. Nigerian Heart Foundation offers additional resources.' },
  { n: 28, region: 'africa', name: 'Smoking Cessation Clinics', org: 'Ministry of Health and Population', country: 'Egypt', blurb: 'MoHP runs a national network of smoking cessation clinics across governorates, offering behavioural counselling and prescription cessation medication.', website: 'https://www.mohp.gov.eg/', phone: null, languages: ['Arabic'], support: ['clinic'], cost: 'Subsidised', notes: 'Ask at any MoHP primary care unit for the nearest clinic.' },

  /* ===== ASIA ===== */
  { n: 29, region: 'asia', name: 'I Quit · 28-Day Countdown', org: 'Health Promotion Board', country: 'Singapore', blurb: "HPB's structured 28-day online programme, backed by trained coaches on QuitLine. Free NRT starter kits available for enrolled participants.", website: 'https://www.healthhub.sg/programmes/iquit', phone: '1800 438 2000', languages: ['English', 'Mandarin', 'Malay', 'Tamil'], support: ['phone', 'online'], cost: 'Free', notes: 'Get a QuitLine callback via the HealthHub site.' },
  { n: 30, region: 'asia', name: 'Quitline', org: 'COSH · Hong Kong Council on Smoking and Health', country: 'Hong Kong SAR', blurb: 'Free confidential counselling by phone or WhatsApp, funded by the Department of Health. Structured 8-week cessation programme.', website: 'https://www.livetobaccofree.hk/', phone: '1833 183', languages: ['Cantonese', 'English', 'Mandarin'], support: ['phone', 'online'], cost: 'Free', notes: 'WhatsApp: 9575 6099 for text-based counselling.' },
  { n: 31, region: 'asia', name: 'e-kinen.jp', org: 'Ministry of Health, Labour and Welfare', country: 'Japan', blurb: "MHLW-backed cessation portal with a nationwide clinic finder for kin'en gairai (smoking cessation clinics), covered by national health insurance.", website: 'https://e-kinen.jp/', phone: null, languages: ['Japanese'], support: ['online', 'clinic'], cost: 'Covered by insurance (~30% co-pay)', notes: '12-week structured programme is the standard clinic offering.' },
  { n: 32, region: 'asia', name: 'mCessation Programme', org: 'Ministry of Health & Family Welfare + WHO', country: 'India', blurb: "India's national text-based cessation programme reaches over 8 million registered users. Personalised SMS support in Hindi and English.", website: 'https://nhm.gov.in/', phone: null, languages: ['Hindi', 'English'], support: ['text'], cost: 'Free', notes: 'Give a missed call to 011-22901701 to register, or SMS QUIT to 011-22901701.' },
  { n: 33, region: 'asia', name: 'Taiwan Quitline', org: 'Health Promotion Administration', country: 'Taiwan', blurb: "HPA's national quitline plus subsidised cessation clinics through health insurance. Callback service available.", website: 'https://www.tsh.org.tw/', phone: '0800-63-63-63', languages: ['Mandarin', 'Taiwanese', 'Hakka'], support: ['phone', 'clinic'], cost: 'Free', notes: 'Open Mon–Sat, extended hours.' },
  { n: 34, region: 'asia', name: 'mQuit', org: 'Kementerian Kesihatan Malaysia (MoH)', country: 'Malaysia', blurb: "Malaysia's national cessation service and clinic locator. Free counselling at government facilities under the Nicotine Replacement Therapy programme.", website: 'https://jomquit.moh.gov.my/', phone: null, languages: ['Malay', 'English'], support: ['online', 'clinic'], cost: 'Free at MoH facilities', notes: "Locator tool finds your nearest 'klinik berhenti merokok'." },
  { n: 35, region: 'asia', name: 'Nosmoke', org: 'KHEPI · Korea Health Promotion Institute', country: 'South Korea', blurb: "Korea's national cessation service: helpline, mobile counselling, and a nationwide network of smoking cessation clinics with subsidised medication.", website: 'https://nosmk.khepi.or.kr/', phone: '1544-9030', languages: ['Korean'], support: ['phone', 'clinic'], cost: 'Free (medication subsidised)', notes: 'Residential cessation camps also available for heavy smokers.' },

  /* ===== OCEANIA ===== */
  { n: 36, region: 'oceania', name: 'Quit · Quitline', org: 'Cancer Council Victoria', country: 'Australia', blurb: "Australia's national cessation programme. Free tailored phone counselling with interpreter support, plus the My QuitBuddy app for tracking smoke-free days, cravings, and savings.", website: 'https://www.quit.org.au/', phone: '13 78 48', languages: ['English', '+ interpreter service'], support: ['phone', 'online', 'app'], cost: 'Free', notes: 'Dedicated pathways for Aboriginal and Torres Strait Islander callers, and LGBTIQA+ communities.' },
  { n: 37, region: 'oceania', name: 'iCanQuit', org: 'NSW Health', country: 'Australia', blurb: "NSW Health's online community for people quitting smoking. Free resources, a member community, and personalised quit plans.", website: 'https://www.icanquit.com.au/', phone: null, languages: ['English'], support: ['online'], cost: 'Free', notes: 'Peer support forum is the standout feature.' },
  { n: 38, region: 'oceania', name: 'Quitline · Me Mutu', org: 'Whakarongorau Aotearoa', country: 'New Zealand', blurb: 'Free phone and text-based counselling, plus access to subsidised NRT (patches, gum, lozenges) shipped to your door.', website: 'https://quit.org.nz/', phone: '0800 778 778', languages: ['English', 'te reo Māori'], support: ['phone', 'text', 'online'], cost: 'Free', notes: 'Text 4006 to start the SMS support programme.' },
  { n: 39, region: 'oceania', name: 'Smokefree Aotearoa', org: 'Manatū Hauora · Ministry of Health', country: 'New Zealand', blurb: 'The government-backed portal for smokefree resources, with specific pathways for Māori and Pacific communities and a live directory of local cessation services.', website: 'https://www.smokefree.org.nz/', phone: null, languages: ['English', 'te reo Māori'], support: ['online', 'clinic'], cost: 'Free', notes: 'Includes pregnancy-specific and vaping cessation content.' },
  { n: 40, region: 'oceania', name: 'WHO Western Pacific · Tobacco Cessation', org: 'World Health Organization', country: 'Regional', blurb: "Regional hub covering cessation resources across Pacific Island nations that don't have a standalone national quitline: Fiji, Samoa, Tonga, Vanuatu, PNG.", website: 'https://www.who.int/westernpacific/health-topics/tobacco', phone: null, languages: ['English', '+ Pacific languages'], support: ['online'], cost: 'Free', notes: 'Directs to Ministry of Health cessation contacts for each Pacific country.' },
];

/* ============================================================
   Helpers
   ============================================================ */
const pad = (n: number) => String(n).padStart(2, '0');
const cleanUrl = (u: string) => u.replace(/^https?:\/\//, '').replace(/\/$/, '');

/* ============================================================
   Component
   ============================================================ */
export default function QuitListPage() {
  const [regions, setRegions] = useState<Set<RegionKey>>(new Set());
  const [support, setSupport] = useState<Set<SupportKey>>(new Set());
  const [openId, setOpenId] = useState<number | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const hydrated = useRef(false);

  /* URL parsing on mount */
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const r = params.get('r');
    const s = params.get('s');
    if (r) setRegions(new Set(r.split(',').filter((v): v is RegionKey => v in REGIONS)));
    if (s) setSupport(new Set(s.split(',').filter((v): v is SupportKey => v in SUPPORT)));
    const hashMatch = window.location.hash.match(/^#service-(\d+)$/);
    if (hashMatch) {
      const n = parseInt(hashMatch[1], 10);
      if (SERVICES.find((x) => x.n === n)) setOpenId(n);
    }
    hydrated.current = true;
  }, []);

  /* URL sync after hydration */
  useEffect(() => {
    if (!hydrated.current) return;
    const params = new URLSearchParams();
    if (regions.size) params.set('r', [...regions].join(','));
    if (support.size) params.set('s', [...support].join(','));
    const q = params.toString();
    const hash = openId !== null ? `#service-${pad(openId)}` : '';
    window.history.replaceState(null, '', window.location.pathname + (q ? `?${q}` : '') + hash);
  }, [regions, support, openId]);

  /* Open/close dialog imperatively */
  useEffect(() => {
    const dlg = dialogRef.current;
    if (!dlg) return;
    if (openId !== null && !dlg.open) dlg.showModal();
    else if (openId === null && dlg.open) dlg.close();
  }, [openId]);

  const filtered = useMemo(
    () =>
      SERVICES.filter((s) => {
        if (regions.size && !regions.has(s.region)) return false;
        if (support.size && !s.support.some((x) => support.has(x))) return false;
        return true;
      }),
    [regions, support]
  );

  const grouped = useMemo(() => {
    const order = Object.keys(REGIONS) as RegionKey[];
    return order
      .map((key) => ({
        key,
        meta: REGIONS[key],
        items: filtered.filter((s) => s.region === key),
      }))
      .filter((g) => g.items.length > 0);
  }, [filtered]);

  const toggleRegion = (key: RegionKey) => {
    setRegions((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const toggleSupport = (key: SupportKey) => {
    setSupport((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const clearFilters = () => {
    setRegions(new Set());
    setSupport(new Set());
  };

  const phoneOnlyPreset = () => {
    setRegions(new Set());
    setSupport(new Set(['phone']));
    document.getElementById('ql-library')?.scrollIntoView({ behavior: 'smooth' });
  };

  const copyDetails = useCallback((s: Service, btn: HTMLButtonElement) => {
    const lines = [
      s.name,
      `${s.org} · ${s.country}`,
      '',
      s.phone ? `Phone: ${s.phone}` : null,
      s.website ? `Web: ${s.website}` : null,
      `Languages: ${s.languages.join(', ')}`,
      `Support: ${s.support.map((k) => SUPPORT[k]).join(', ')}`,
      `Cost: ${s.cost}`,
      '',
      s.blurb,
      s.notes ? `\nNote: ${s.notes}` : null,
      '',
      'From The Quit List · FIT50',
    ]
      .filter(Boolean)
      .join('\n');

    navigator.clipboard
      .writeText(lines)
      .then(() => {
        const original = btn.textContent;
        btn.textContent = 'Copied ✓';
        setTimeout(() => {
          btn.textContent = original;
        }, 1500);
      })
      .catch(() => {
        btn.textContent = 'Copy failed';
      });
  }, []);

  const activeService = openId !== null ? SERVICES.find((s) => s.n === openId) ?? null : null;

  return (
    <div className={`ql-root ${fraunces.variable} ${inter.variable}`}>
      {/* Hero */}
      <section className="ql-hero">
        <div className="ql-wrap">
          <span className="ql-eyebrow">Rule 04 companion · Clear Lungs</span>
          <h1 className="ql-h1">
            The <em>Quit List</em>.
          </h1>
          <p className="ql-lede">
            Forty tobacco-cessation services across six continents. Phone lines, online programmes,
            apps, and clinic networks — pick the one closest to home. Most are free.
          </p>
          <div className="ql-cta-row">
            <a href="#ql-library" className="ql-btn ql-btn-primary">
              Browse the list
            </a>
            <button type="button" className="ql-btn ql-btn-ghost" onClick={phoneOnlyPreset}>
              Phone lines only
            </button>
          </div>
        </div>
      </section>

      {/* Marquee */}
      <div className="ql-marquee" aria-hidden="true">
        <div className="ql-marquee-track">
          {Array.from({ length: 3 }).map((_, i) => (
            <span key={i} className="ql-marquee-group">
              <span>Forty services</span>
              <span className="ql-star">✦</span>
              <span>Six continents</span>
              <span className="ql-star">✦</span>
              <span>Free to call</span>
              <span className="ql-star">✦</span>
              <span>No paywall</span>
              <span className="ql-star">✦</span>
            </span>
          ))}
        </div>
      </div>

      {/* Library + Filters */}
      <section id="ql-library" className="ql-library">
        <div className="ql-wrap">
          <div className="ql-filter-wrap">
            <div className="ql-filter-groups">
              <div className="ql-filter-group">
                <span className="ql-filter-label">Region</span>
                <div className="ql-pills">
                  {(Object.entries(REGIONS) as [RegionKey, typeof REGIONS[RegionKey]][]).map(([k, v]) => (
                    <button
                      key={k}
                      type="button"
                      className="ql-pill"
                      aria-pressed={regions.has(k)}
                      onClick={() => toggleRegion(k)}
                    >
                      {v.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="ql-filter-group">
                <span className="ql-filter-label">Support</span>
                <div className="ql-pills">
                  {(Object.entries(SUPPORT) as [SupportKey, string][]).map(([k, label]) => (
                    <button
                      key={k}
                      type="button"
                      className="ql-pill"
                      aria-pressed={support.has(k)}
                      onClick={() => toggleSupport(k)}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="ql-filter-meta">
              <span className="ql-count">
                {filtered.length} service{filtered.length === 1 ? '' : 's'}
              </span>
              <button type="button" className="ql-clear-btn" onClick={clearFilters}>
                Clear filters
              </button>
            </div>
          </div>

          {grouped.length === 0 ? (
            <div className="ql-empty">
              <h3>Nothing matches that combo.</h3>
              <p>Try clearing a filter.</p>
              <button type="button" className="ql-btn ql-btn-ghost" onClick={clearFilters}>
                Clear filters
              </button>
            </div>
          ) : (
            grouped.map(({ key, meta, items }) => (
              <section key={key} className="ql-region-section" id={`ql-region-${key}`}>
                <div className="ql-region-header">
                  <h2 className="ql-region-title">{meta.label}</h2>
                  <div className="ql-region-count">
                    {items.length} service{items.length === 1 ? '' : 's'}
                  </div>
                </div>
                <p className="ql-region-blurb">{meta.blurb}</p>
                <div className="ql-grid" role="list">
                  {items.map((s) => (
                    <button
                      key={s.n}
                      type="button"
                      className="ql-tile"
                      role="listitem"
                      onClick={() => setOpenId(s.n)}
                    >
                      <div className="ql-tile-top">
                        <div className="ql-tile-num">{pad(s.n)}</div>
                        <div className="ql-tile-country">{s.country}</div>
                      </div>
                      <div className="ql-tile-name">{s.name}</div>
                      <div className="ql-tile-org">{s.org}</div>
                      <div className="ql-tile-blurb">{s.blurb}</div>
                      <div className="ql-tile-meta">
                        {s.support.slice(0, 3).map((k) => (
                          <span
                            key={k}
                            className={`ql-chip ${k === 'phone' ? 'ql-chip-phone' : 'ql-chip-neutral'}`}
                          >
                            {SUPPORT[k]}
                          </span>
                        ))}
                      </div>
                      <div className="ql-tile-langs">
                        {s.languages.map((l, i) => (
                          <span key={i} className="ql-tile-lang">
                            {l}
                          </span>
                        ))}
                      </div>
                    </button>
                  ))}
                </div>
              </section>
            ))
          )}
        </div>
      </section>

      {/* Marquee 2 */}
      <div className="ql-marquee" aria-hidden="true">
        <div className="ql-marquee-track">
          {Array.from({ length: 3 }).map((_, i) => (
            <span key={i} className="ql-marquee-group">
              <span>Pick up the phone</span>
              <span className="ql-star">✦</span>
              <span>Make the call</span>
              <span className="ql-star">✦</span>
              <span>Set a quit date</span>
              <span className="ql-star">✦</span>
              <span>Day one starts today</span>
              <span className="ql-star">✦</span>
            </span>
          ))}
        </div>
      </div>

      {/* Coda */}
      <section className="ql-coda">
        <div className="ql-wrap">
          <h2 className="ql-coda-h2">Fifty days smoke-free starts tomorrow.</h2>
        </div>
      </section>

      {/* Modal */}
      <dialog
        ref={dialogRef}
        className="ql-modal"
        aria-label="Service details"
        onClose={() => setOpenId(null)}
        onClick={(e) => {
          if ((e.target as HTMLElement).classList.contains('ql-modal')) {
            setOpenId(null);
          }
        }}
      >
        {activeService && (
          <div className="ql-modal-body">
            <div className="ql-modal-header">
              <div>
                <div className="ql-modal-eyebrow">
                  No. {pad(activeService.n)} · {REGIONS[activeService.region].label}
                </div>
                <div className="ql-modal-title">{activeService.name}</div>
                <div className="ql-modal-org">
                  {activeService.org} · {activeService.country}
                </div>
              </div>
              <button
                type="button"
                className="ql-modal-close"
                aria-label="Close"
                onClick={() => setOpenId(null)}
              >
                ×
              </button>
            </div>
            <div className="ql-modal-blurb">{activeService.blurb}</div>
            <div className="ql-modal-meta">
              <div>
                <span>Phone</span>
                <strong style={activeService.phone ? undefined : { color: 'var(--ql-ink-3)' }}>
                  {activeService.phone ?? 'Not applicable'}
                </strong>
              </div>
              {activeService.website && (
                <div>
                  <span>Website</span>
                  <strong>
                    <a href={activeService.website} target="_blank" rel="noopener noreferrer">
                      {cleanUrl(activeService.website)}
                    </a>
                  </strong>
                </div>
              )}
              <div>
                <span>Languages</span>
                <strong>{activeService.languages.join(', ')}</strong>
              </div>
              <div>
                <span>Cost</span>
                <strong>{activeService.cost}</strong>
              </div>
            </div>
            <div className="ql-modal-section-title">Support types</div>
            <div className="ql-modal-support">
              {activeService.support.map((k) => (
                <span
                  key={k}
                  className={`ql-chip ${k === 'phone' ? 'ql-chip-phone' : 'ql-chip-neutral'}`}
                >
                  {SUPPORT[k]}
                </span>
              ))}
            </div>
            {activeService.notes && (
              <div className="ql-modal-note">
                <strong>Good to know</strong>
                {activeService.notes}
              </div>
            )}
            <div className="ql-modal-actions">
              {activeService.website && (
                <a
                  href={activeService.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ql-modal-action-btn ql-modal-action-primary"
                >
                  Visit site ↗
                </a>
              )}
              <button
                type="button"
                className="ql-modal-action-btn"
                onClick={(e) => copyDetails(activeService, e.currentTarget)}
              >
                Copy details
              </button>
              <button
                type="button"
                className="ql-modal-action-btn"
                onClick={() => window.print()}
              >
                Print
              </button>
            </div>
          </div>
        )}
      </dialog>

      <style jsx>{`
        /* ---------- Scoped tokens ---------- */
        .ql-root {
          /* Palette */
          --ql-lavender: #e4def3;
          --ql-lavender-deep: #d2c8ea;
          --ql-lavender-soft: #efeaf9;
          --ql-paper: #fbf7ee;
          --ql-paper-warm: #f3ecdc;
          --ql-coral: #f05a3e;
          --ql-coral-deep: #d8422c;
          --ql-ink: #1a1730;
          --ql-ink-2: #4c4568;
          --ql-ink-3: #7a7396;
          --ql-border: rgba(26, 23, 48, 0.1);
          --ql-border-strong: rgba(26, 23, 48, 0.2);

          /* Type */
          --ql-fd: var(--ql-font-display, 'Fraunces', 'Iowan Old Style', Georgia, serif);
          --ql-fb: var(--ql-font-body, 'Inter', system-ui, -apple-system, sans-serif);

          /* Shape */
          --ql-radius: 20px;
          --ql-radius-sm: 10px;
          --ql-radius-pill: 999px;
          --ql-shadow: 0 1px 0 rgba(26, 23, 48, 0.04), 0 12px 28px -14px rgba(26, 23, 48, 0.2);
          --ql-shadow-hover: 0 1px 0 rgba(26, 23, 48, 0.06), 0 22px 40px -18px rgba(26, 23, 48, 0.28);
          --ql-tx-fast: 160ms cubic-bezier(0.4, 0, 0.2, 1);
          --ql-tx-mid: 260ms cubic-bezier(0.4, 0, 0.2, 1);

          /* Base */
          background: var(--ql-lavender);
          color: var(--ql-ink);
          font-family: var(--ql-fb);
          font-size: 16px;
          line-height: 1.5;
          min-height: 100vh;
          -webkit-font-smoothing: antialiased;
        }

        :where(.ql-root *) {
          box-sizing: border-box;
        }
        :where(.ql-root button) {
          font: inherit;
          cursor: pointer;
          border: none;
          background: none;
          color: inherit;
          padding: 0;
        }
        :where(.ql-root a) {
          color: inherit;
          text-decoration: none;
        }

        .ql-wrap {
          max-width: 1240px;
          margin: 0 auto;
          padding: 0 28px;
        }

        /* ---------- Hero ---------- */
        .ql-hero {
          padding: 48px 0 64px;
        }
        .ql-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: var(--ql-coral);
          margin-bottom: 28px;
        }
        .ql-eyebrow::before {
          content: '';
          width: 32px;
          height: 1.5px;
          background: var(--ql-coral);
        }
        .ql-h1 {
          font-family: var(--ql-fd);
          font-weight: 900;
          font-size: clamp(60px, 11vw, 140px);
          line-height: 0.9;
          letter-spacing: -0.04em;
          color: var(--ql-ink);
          margin: 0 0 28px;
        }
        .ql-h1 em {
          font-style: italic;
          color: var(--ql-coral);
          font-weight: 400;
        }
        .ql-lede {
          font-size: 20px;
          max-width: 620px;
          color: var(--ql-ink-2);
          margin: 0 0 36px;
          line-height: 1.5;
        }
        .ql-cta-row {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }
        .ql-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 15px 26px;
          border-radius: var(--ql-radius-pill);
          font-weight: 600;
          font-size: 15px;
          transition: background var(--ql-tx-fast), border-color var(--ql-tx-fast), color var(--ql-tx-fast), transform var(--ql-tx-fast);
          border: none;
        }
        .ql-btn:active {
          transform: translateY(1px);
        }
        .ql-btn-primary {
          background: var(--ql-ink);
          color: var(--ql-paper);
        }
        .ql-btn-primary:hover {
          background: var(--ql-coral);
        }
        .ql-btn-ghost {
          border: 1.5px solid var(--ql-ink);
          color: var(--ql-ink);
          background: transparent;
        }
        .ql-btn-ghost:hover {
          border-color: var(--ql-coral);
          color: var(--ql-coral);
        }

        /* ---------- Marquee ---------- */
        .ql-marquee {
          border-top: 1.5px solid var(--ql-ink);
          border-bottom: 1.5px solid var(--ql-ink);
          overflow: hidden;
          white-space: nowrap;
          font-family: var(--ql-fd);
          font-size: 15px;
          font-weight: 600;
          letter-spacing: 0.14em;
          padding: 16px 0;
          background: var(--ql-lavender);
          text-transform: uppercase;
        }
        .ql-marquee-track {
          display: inline-flex;
          animation: ql-marquee 46s linear infinite;
          will-change: transform;
        }
        .ql-marquee-group span {
          padding: 0 24px;
        }
        .ql-marquee-group .ql-star {
          color: var(--ql-coral);
          font-size: 18px;
        }
        @keyframes ql-marquee {
          from {
            transform: translateX(0);
          }
          to {
            transform: translateX(-33.333%);
          }
        }

        /* ---------- Filter bar ---------- */
        .ql-library {
          padding-top: 36px;
          padding-bottom: 60px;
        }
        .ql-filter-wrap {
          position: sticky;
          top: 0;
          z-index: 30;
          background: var(--ql-lavender);
          padding: 22px 0 18px;
          border-bottom: 1px solid var(--ql-border);
        }
        .ql-filter-groups {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .ql-filter-group {
          display: flex;
          align-items: center;
          gap: 14px;
          flex-wrap: wrap;
        }
        .ql-filter-label {
          font-family: var(--ql-fd);
          font-weight: 700;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.14em;
          color: var(--ql-ink);
          min-width: 90px;
        }
        .ql-pills {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }
        .ql-pill {
          padding: 7px 14px;
          border-radius: var(--ql-radius-pill);
          background: var(--ql-paper);
          border: 1px solid var(--ql-border);
          font-size: 13px;
          color: var(--ql-ink-2);
          font-weight: 500;
          transition: background var(--ql-tx-fast), color var(--ql-tx-fast), border-color var(--ql-tx-fast);
        }
        .ql-pill:hover {
          border-color: var(--ql-coral);
          color: var(--ql-coral);
        }
        .ql-pill[aria-pressed='true'] {
          background: var(--ql-coral);
          color: var(--ql-paper);
          border-color: var(--ql-coral);
        }
        .ql-filter-meta {
          display: flex;
          align-items: center;
          gap: 20px;
          margin-top: 16px;
          padding-top: 16px;
          border-top: 1px dashed var(--ql-border);
          font-size: 14px;
          color: var(--ql-ink-2);
        }
        .ql-count {
          font-weight: 600;
          color: var(--ql-ink);
        }
        .ql-clear-btn {
          color: var(--ql-coral);
          font-weight: 600;
          text-decoration: underline;
          text-underline-offset: 4px;
          font-size: 14px;
        }
        .ql-clear-btn:hover {
          color: var(--ql-coral-deep);
        }

        /* ---------- Region section ---------- */
        .ql-region-section {
          margin-top: 36px;
          margin-bottom: 56px;
        }
        .ql-region-section:last-child {
          margin-bottom: 0;
        }
        .ql-region-header {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          gap: 20px;
          flex-wrap: wrap;
          padding-bottom: 18px;
          margin-bottom: 22px;
          border-bottom: 1.5px solid var(--ql-ink);
        }
        .ql-region-title {
          font-family: var(--ql-fd);
          font-weight: 600;
          font-size: clamp(32px, 5vw, 52px);
          line-height: 1.02;
          letter-spacing: -0.03em;
          color: var(--ql-ink);
          margin: 0;
        }
        .ql-region-count {
          font-family: var(--ql-fd);
          font-weight: 700;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.14em;
          color: var(--ql-ink-3);
        }
        .ql-region-blurb {
          font-size: 15px;
          color: var(--ql-ink-2);
          max-width: 620px;
          margin: 0 0 22px;
          line-height: 1.55;
        }

        /* ---------- Grid + Tile ---------- */
        .ql-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
        }
        .ql-tile {
          background: #ffffff;
          border-radius: var(--ql-radius);
          padding: 24px 22px 22px;
          box-shadow: var(--ql-shadow);
          border: 1.5px solid transparent;
          cursor: pointer;
          text-align: left;
          display: flex;
          flex-direction: column;
          gap: 12px;
          min-height: 320px;
          overflow-wrap: anywhere;
          transition: transform var(--ql-tx-fast), box-shadow var(--ql-tx-fast), border-color var(--ql-tx-fast);
          position: relative;
          overflow: hidden;
        }
        .ql-tile:hover {
          transform: translateY(-3px);
          box-shadow: var(--ql-shadow-hover);
          border-color: var(--ql-coral);
        }
        .ql-tile:focus-visible {
          outline: 2px solid var(--ql-coral);
          outline-offset: 3px;
        }
        .ql-tile-top {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 10px;
        }
        .ql-tile-num {
          font-family: var(--ql-fd);
          font-weight: 300;
          font-style: italic;
          font-size: 64px;
          line-height: 0.85;
          color: var(--ql-coral);
          letter-spacing: -0.04em;
        }
        .ql-tile-country {
          font-family: var(--ql-fd);
          font-weight: 700;
          font-size: 9px;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: var(--ql-ink);
          border: 1px solid var(--ql-ink);
          padding: 4px 8px;
          border-radius: var(--ql-radius-pill);
          text-align: right;
          white-space: nowrap;
        }
        .ql-tile-name {
          font-family: var(--ql-fd);
          font-weight: 600;
          font-size: 18px;
          line-height: 1.2;
          letter-spacing: -0.02em;
          color: var(--ql-ink);
          overflow-wrap: anywhere;
        }
        .ql-tile-org {
          font-size: 12px;
          color: var(--ql-ink-3);
          font-weight: 500;
          margin-top: -6px;
          overflow-wrap: anywhere;
        }
        .ql-tile-blurb {
          font-size: 12.5px;
          color: var(--ql-ink-2);
          line-height: 1.5;
          flex-grow: 1;
          overflow-wrap: anywhere;
        }
        .ql-tile-meta {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
          align-items: center;
        }
        .ql-chip {
          font-size: 10.5px;
          font-weight: 600;
          padding: 4px 9px;
          border-radius: var(--ql-radius-pill);
          letter-spacing: 0.04em;
        }
        .ql-chip-phone {
          color: var(--ql-coral);
          border: 1px solid var(--ql-coral);
        }
        .ql-chip-neutral {
          color: var(--ql-ink-2);
          border: 1px solid var(--ql-border-strong);
        }
        .ql-tile-langs {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
          font-size: 10.5px;
          color: var(--ql-ink-3);
          text-transform: uppercase;
          letter-spacing: 0.1em;
          font-weight: 600;
          padding-top: 10px;
          border-top: 1px dashed var(--ql-border);
        }
        .ql-tile-lang + .ql-tile-lang::before {
          content: ' · ';
          color: var(--ql-ink-3);
          padding: 0 2px;
        }

        /* ---------- Empty ---------- */
        .ql-empty {
          padding: 80px 20px;
          text-align: center;
          background: var(--ql-paper);
          border-radius: var(--ql-radius);
          margin-top: 20px;
        }
        .ql-empty h3 {
          font-family: var(--ql-fd);
          font-weight: 600;
          font-size: 32px;
          color: var(--ql-ink);
          margin: 0 0 12px;
          letter-spacing: -0.02em;
        }
        .ql-empty p {
          color: var(--ql-ink-2);
          margin: 0 0 24px;
        }

        /* ---------- Coda ---------- */
        .ql-coda {
          padding: 80px 0 100px;
          text-align: center;
        }
        .ql-coda-h2 {
          font-family: var(--ql-fd);
          font-weight: 400;
          font-style: italic;
          font-size: clamp(40px, 6vw, 76px);
          line-height: 1.02;
          letter-spacing: -0.03em;
          margin: 0 auto 32px;
          color: var(--ql-ink);
          max-width: 800px;
        }
        .ql-coda-note {
          font-size: 13px;
          color: var(--ql-ink-3);
          max-width: 560px;
          margin: 0 auto 32px;
          padding: 16px 20px;
          border: 1px dashed var(--ql-border-strong);
          border-radius: var(--ql-radius-sm);
        }

        /* ---------- Modal ---------- */
        .ql-modal {
          border: none;
          padding: 0;
          border-radius: var(--ql-radius);
          background: var(--ql-paper);
          max-width: 640px;
          width: calc(100% - 32px);
          max-height: 90vh;
          overflow: hidden;
          box-shadow: 0 30px 80px -20px rgba(26, 23, 48, 0.4);
          color: var(--ql-ink);
          font-family: var(--ql-fb);
        }
        .ql-modal::backdrop {
          background: rgba(26, 23, 48, 0.55);
          backdrop-filter: blur(3px);
        }
        .ql-modal[open] {
          animation: ql-modal-in var(--ql-tx-mid) ease-out;
        }
        @keyframes ql-modal-in {
          from {
            opacity: 0;
            transform: translateY(12px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        .ql-modal-body {
          padding: 32px 34px 28px;
          overflow-y: auto;
          max-height: 90vh;
        }
        .ql-modal-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 18px;
        }
        .ql-modal-eyebrow {
          font-family: var(--ql-fd);
          font-weight: 400;
          font-style: italic;
          font-size: 20px;
          color: var(--ql-coral);
          margin-bottom: 4px;
        }
        .ql-modal-title {
          font-family: var(--ql-fd);
          font-weight: 600;
          font-size: 36px;
          line-height: 1.02;
          letter-spacing: -0.025em;
          color: var(--ql-ink);
        }
        .ql-modal-org {
          font-size: 14px;
          color: var(--ql-ink-3);
          margin-top: 6px;
        }
        .ql-modal-close {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: var(--ql-ink);
          color: var(--ql-paper);
          font-size: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: background var(--ql-tx-fast);
        }
        .ql-modal-close:hover {
          background: var(--ql-coral);
        }
        .ql-modal-blurb {
          font-size: 15px;
          color: var(--ql-ink-2);
          line-height: 1.55;
          margin-bottom: 22px;
        }
        .ql-modal-meta {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px 20px;
          padding: 18px 0;
          border-top: 1px solid var(--ql-border);
          border-bottom: 1px solid var(--ql-border);
          margin-bottom: 22px;
        }
        .ql-modal-meta > div span {
          display: block;
          font-family: var(--ql-fd);
          font-weight: 700;
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.14em;
          color: var(--ql-ink-3);
          margin-bottom: 3px;
        }
        .ql-modal-meta > div strong {
          font-weight: 600;
          color: var(--ql-ink);
          font-size: 14px;
          word-break: break-word;
        }
        .ql-modal-meta > div strong a {
          color: var(--ql-coral);
          border-bottom: 1px solid transparent;
          transition: border-color var(--ql-tx-fast);
        }
        .ql-modal-meta > div strong a:hover {
          border-color: var(--ql-coral);
        }
        .ql-modal-section-title {
          font-family: var(--ql-fd);
          font-weight: 700;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.16em;
          color: var(--ql-coral);
          margin-bottom: 10px;
        }
        .ql-modal-support {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          margin-bottom: 22px;
        }
        .ql-modal-support .ql-chip {
          font-size: 12px;
          padding: 5px 11px;
        }
        .ql-modal-note {
          padding: 14px 16px;
          background: var(--ql-lavender-soft);
          border-radius: var(--ql-radius-sm);
          font-size: 13px;
          color: var(--ql-ink-2);
          margin-bottom: 12px;
        }
        .ql-modal-note strong {
          font-family: var(--ql-fd);
          font-weight: 700;
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.14em;
          color: var(--ql-coral);
          display: block;
          margin-bottom: 4px;
        }
        .ql-modal-actions {
          display: flex;
          gap: 6px;
          padding-top: 16px;
          border-top: 1px solid var(--ql-border);
          flex-wrap: wrap;
        }
        .ql-modal-action-btn {
          font-size: 13px;
          font-weight: 500;
          color: var(--ql-ink-2);
          padding: 8px 14px;
          border-radius: var(--ql-radius-pill);
          transition: color var(--ql-tx-fast), background var(--ql-tx-fast);
        }
        .ql-modal-action-btn:hover {
          color: var(--ql-coral);
          background: var(--ql-lavender-soft);
        }
        .ql-modal-action-primary {
          background: var(--ql-ink);
          color: var(--ql-paper);
          padding: 10px 18px;
        }
        .ql-modal-action-primary:hover {
          background: var(--ql-coral);
          color: var(--ql-paper);
        }

        /* ---------- Reduced motion ---------- */
        @media (prefers-reduced-motion: reduce) {
          .ql-root *,
          .ql-root *::before,
          .ql-root *::after {
            animation-duration: 0.01ms !important;
            transition-duration: 0.01ms !important;
          }
          .ql-marquee-track {
            animation: none;
          }
        }

        /* ---------- Responsive ---------- */
        @media (max-width: 1024px) {
          .ql-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }
        @media (max-width: 720px) {
          .ql-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          .ql-modal-meta {
            grid-template-columns: 1fr;
          }
          .ql-hero {
            padding: 24px 0 40px;
          }
          .ql-filter-label {
            min-width: auto;
            width: 100%;
          }
          .ql-modal-body {
            padding: 24px 22px 20px;
          }
          .ql-modal-title {
            font-size: 30px;
          }
          .ql-tile {
            min-height: 300px;
            padding: 20px 18px 18px;
          }
          .ql-tile-num {
            font-size: 52px;
          }
        }
        @media (max-width: 440px) {
          .ql-grid {
            grid-template-columns: 1fr;
          }
          .ql-tile {
            min-height: 260px;
          }
        }
      `}</style>
    </div>
  );
}
