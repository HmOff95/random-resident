import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        cream: '#FFF8F0',
        sand: '#FDE8C8',
        coral: {
          DEFAULT: '#FF7F5C',
          dark: '#E86A45',
        },
        mint: '#7ECFB3',
        brown: {
          DEFAULT: '#3D2B1F',
          light: '#7A5C4F',
        },
        'white-warm': '#FFFDF9',
      },
      fontFamily: {
        nunito: ['Nunito', 'sans-serif'],
      },
      boxShadow: {
        warm: '0 4px 24px rgba(61, 43, 31, 0.10)',
        coral: '0 2px 8px rgba(255, 127, 92, 0.25)',
        resident: '0 2px 12px rgba(61, 43, 31, 0.15)',
      },
    },
  },
  plugins: [],
}
export default config
