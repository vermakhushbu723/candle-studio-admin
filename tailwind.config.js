/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  corePlugins: { preflight: false },
  theme: {
    extend: {
      // Same palette as the Jyotessa storefront
      colors: {
        terra: { DEFAULT: '#E3A77C', dark: '#6C2408', light: '#F1D2BE', soft: '#FBF0EA' },
        cocoa: { DEFAULT: '#E3A77C', dark: '#8A3A16', light: '#F6EDE4' },
        char: { DEFAULT: '#3A1507', light: '#4A4440' },
        cream: '#FFF9F5',
        gold: '#C98A4B',
        linen: '#EADBC8',
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        brand: ['Cinzel', '"Playfair Display"', 'Georgia', 'serif'],
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
      },
      boxShadow: { soft: '0 10px 30px -18px rgba(58,21,7, 0.25)' },
    },
  },
  plugins: [],
};
