/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,ts}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        // Brand primary — anchored at 700 = #363E7F
        primary: {
          50:  '#F0F1FB',
          100: '#E2E4F6',
          200: '#C5C8ED',
          300: '#9EA4E0',
          400: '#7179D1',
          500: '#4F57BD',
          600: '#3F48A4',
          700: '#363E7F',
          800: '#272E63',
          900: '#1A1F45',
          950: '#0E1127',
        },
        // Dark-mode surface palette — deep navy, not gray
        navy: {
          50:  '#F0F2FF',
          100: '#E0E5FF',
          200: '#C0CBFF',
          300: '#8DA0E5',
          400: '#607AB5',
          500: '#3A4D7A',
          600: '#253660',
          700: '#1E2D4A',
          800: '#162240',
          900: '#111D38',
          950: '#0D1328',
        },
      },
    },
  },
  plugins: [],
};
