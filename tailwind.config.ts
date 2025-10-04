import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        midnight: {
          50: '#f2f6ff',
          100: '#e6edff',
          200: '#c9d6ff',
          300: '#a3b7ff',
          400: '#6f86ff',
          500: '#4a5fff',
          600: '#2f3fe6',
          700: '#232fb3',
          800: '#1c268c',
          900: '#161f6d',
          950: '#0c1240'
        },
        severity: {
          1: '#fef08a',
          2: '#fde047',
          3: '#f59e0b',
          4: '#f97316',
          5: '#ef4444'
        }
      },
      boxShadow: {
        glow: '0 0 30px rgba(99, 102, 241, 0.35)',
      },
      backgroundImage: {
        'arcane-gradient': 'radial-gradient(1200px 800px at 100% -10%, rgba(99, 102, 241, 0.18), transparent 60%), radial-gradient(1000px 600px at -10% 120%, rgba(56, 189, 248, 0.18), transparent 60%)'
      }
    },
  },
  plugins: [],
};

export default config;


