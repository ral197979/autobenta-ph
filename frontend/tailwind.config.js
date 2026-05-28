/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff', 100: '#dbeafe', 200: '#bfdbfe', 300: '#93c5fd',
          400: '#60a5fa', 500: '#3b82f6', 600: '#2563eb', 700: '#1d4ed8',
          800: '#1e40af', 900: '#1e3a8a',
        },
        ph: { red: '#CE1126', blue: '#0038A8', gold: '#FCD116' },
        ink: '#0B1220',
        deepblue: '#1D4ED8',
        electric: '#2563EB',
        accent: '#FACC15',
        slatetext: '#475569',
        softbg: '#F8FAFC',
        cardborder: '#E2E8F0',
      },
      fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] },
    },
  },
  plugins: [],
};
