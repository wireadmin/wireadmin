import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  important: true,
  content: [
    './ui/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}'
  ],
  theme: {
    extend: {
      screens: {
        'xs': '375px',
        '2xl': '1440px',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':
          'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
      colors: {
        primary: {
          DEFAULT: '#88161a'
        },
        transparent: 'transparent',
      },
      fontSize: {
        '3xs': '.5rem',
        '2xs': '.625rem',
        'sm/2': '.8125rem',
        'md': '.9375rem',
      },
      fontWeight: {
        'thin': '100',
        'light': '300',
        'normal': '400',
        'medium': '500',
        'semibold': '600',
        'bold': '700',
        'extrabold': '800',
        'black': '900',
      },
      zIndex: {
        '-100': '100',
        '-1000': '1000',
        '-10000': '10000',
        '100': '100',
        '1000': '1000',
        '10000': '10000',
      }
    },
  },
  plugins: [],
}
export default config
