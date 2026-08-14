import type { EmailGateConfig } from './EmailGate';

export const FRIDGE_CHECKLIST_CONFIG: EmailGateConfig = {
  pdfUrl: '/downloads/fit50-fridge-checklist.pdf',
  pdfFilename: 'FIT50_Fridge_Checklist.pdf',
  previewImage: '/previews/fit50-fridge-checklist.png',
  form: {
    eyebrow: 'Free Daily Fridge Checklist',
    title: 'the fridge checklist',
    lede:
      'A printable, nine-discipline daily tracker for the fifty days. Drop your email and we\u2019ll fire the download straight over. You\u2019ll also get the occasional note from us \u2014 cohort start dates, new tools, and whatever we\u2019ve learned. Unsubscribe whenever, no dramas.',
    buttonText: 'My fridge wants the Checklist!',
    buttonLoadingText: 'Sending\u2026',
  },
  success: {
    eyebrow: 'Well done',
    heading: 'Fridge Fed.',
    body1:
      'You just took step one toward a sexier fridge and finally starting that thing you\u2019ve been putting off. The checklist is downloading now \u2014 stick it up, admire it, and start day one whenever you\u2019re ready.',
    body2:
      'Nothing else to do here. Just know: if you\u2019d rather do this digitally, with a tracker, macro calculator, streak protection and a kanban for the project you\u2019re about to start, we\u2019ve got you.',
    ctaText: 'See the toolkit',
    ctaHref: '/#sign-up',
    textLink: 'I\u2019m good with the printout, thanks',
    textLinkHref: '/#rules',
  },
  newsletterNote: 'We add your email to the FIT50 newsletter. Unsubscribe any time.',
};

export const BODYWEIGHT_FOUR_CONFIG: EmailGateConfig = {
  pdfUrl: '/downloads/fit50-bodyweight-four.pdf',
  pdfFilename: 'FIT50_Bodyweight_Four.pdf',
  previewImage: '/previews/fit50-bodyweight-four.png',
  form: {
    eyebrow: 'Free Workout Guide',
    title: 'the bodyweight four',
    lede:
      'Four workouts. Twenty exercises. Zero equipment. Rotate A \u2192 B \u2192 C \u2192 D across the week and you\u2019ll hit push, pull, legs, core and conditioning every session. Drop your email and we\u2019ll fire the download straight over. Unsubscribe whenever, no dramas.',
    buttonText: 'My love handles demand the guide',
    buttonLoadingText: 'Sending\u2026',
  },
  success: {
    eyebrow: 'Welcome to the work',
    heading: 'Workouts loaded.',
    body1:
      'Twenty exercises, four lines, zero equipment. Start with Line A on day one \u2014 push-ups, supermans, bodyweight squats. Rotate A \u2192 B \u2192 C \u2192 D across the week. Your shoulders will thank you.',
    body2:
      'Nothing else to do here. Just know: if you\u2019d rather do this digitally, with a tracker, streak protection and a kanban for the project you\u2019re about to start, we\u2019ve got you.',
    ctaText: 'See the toolkit',
    ctaHref: '/#sign-up',
    textLink: 'I\u2019m good with the printout, thanks',
    textLinkHref: '/#rules',
  },
  newsletterNote: 'We add your email to the FIT50 newsletter. Unsubscribe any time.',
};

export type EmailGateKind = 'fridge-checklist' | 'bodyweight-four';