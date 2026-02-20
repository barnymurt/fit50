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
        coral: '#E88B5A',
        teal: '#4A9B9B',
        lavender: '#D8B8D0',
        cream: '#F2D9A2',
        charcoal: '#2A2A2A',
      },
      fontFamily: {
        display: ['Titan One', 'cursive'],
        body: ['Space Grotesk', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
