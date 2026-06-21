import type { Config } from 'tailwindcss';

// Paleta da marca espelhada de @iara/ui (terracota / nude / oliva / golden hour).
const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        terracota: { DEFAULT: '#C2683E', dark: '#9E5230' },
        nude: { DEFAULT: '#D9B8A0', light: '#EFE2D6' },
        oliva: { DEFAULT: '#7A7E52', dark: '#5C6040' },
        golden: '#E8A85C',
        ink: '#2B2420',
        paper: '#FBF7F2',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        md: '0.625rem',
      },
    },
  },
  plugins: [],
};

export default config;
