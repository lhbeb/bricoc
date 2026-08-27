import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#233F31', // Deep Forest Green - main brand color
        secondary: '#789676', // Sage Green - secondary accent
        accent: '#789676', // Sage Green accent
        cream: '#FAF6EB', // Warm cream background
        'brand-dark': '#233F31', // Deep Forest Green
        'brand-sage': '#789676', // Sage Green
        'brand-cream': '#FAF6EB', // Cream
        text: '#233F31', // Deep Forest Green text / dark neutral
        'text-gray': '#556B5C', // Muted green-gray text
        'bg-light': '#FAF6EB', // Warm cream light background
        'border-gray': '#E2DDD0', // Warm light border
        'nav-gray': '#789676', // Navigation bar sage green
      },
      fontFamily: {
        sans: ['var(--font-dm-sans)', 'sans-serif'],
        heading: ['var(--font-dm-sans)', 'sans-serif'],
      },
      screens: {
        'xs': '475px',
      },
    },
  },
  plugins: [
    // line-clamp plugin removed; included by default in Tailwind 3.3+
  ],
}
export default config 