/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        ink: '#1A1A1A',
        paper: '#FAF6EE',
        cream: '#F2D9A2',
        coral: '#E88B5A',
        teal: '#4A9B9B',
        lavender: '#D8B8D0',
        rule: 'rgba(26, 26, 26, 0.12)',
        'rule-light': 'rgba(254, 254, 254, 0.14)',
      },
      fontFamily: {
        display: ['var(--font-display)', 'serif'],
        body: ['var(--font-body)', 'sans-serif'],
        marquee: ['var(--font-marquee)', 'sans-serif'],
      },
      fontSize: {
        'display-1': ['clamp(4.5rem, 11vw, 9rem)', { lineHeight: '0.9', letterSpacing: '-0.03em' }],
        'display-2': ['clamp(2.75rem, 6vw, 5rem)', { lineHeight: '1', letterSpacing: '-0.02em' }],
        'h1': ['clamp(2rem, 3.5vw, 2.75rem)', { lineHeight: '1.1', letterSpacing: '-0.01em' }],
        'h2': ['clamp(1.5rem, 2vw, 1.875rem)', { lineHeight: '1.2', letterSpacing: '-0.01em' }],
        'h3': ['clamp(1.25rem, 1.5vw, 1.5rem)', { lineHeight: '1.3' }],
        'body': ['1rem', { lineHeight: '1.6' }],
        'caption': ['0.75rem', { lineHeight: '1.4', letterSpacing: '0.12em' }],
      },
      letterSpacing: {
        tightest: '-0.04em',
        wider: '0.08em',
        widest: '0.18em',
      },
      spacing: {
        section: 'clamp(5rem, 10vw, 8rem)',
      },
      transitionTimingFunction: {
        smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
    },
  },
  plugins: [],
}
