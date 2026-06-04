/** @type {import('tailwindcss').Config} */

// Ryderr Kinetic (light) + Kinetic Dark design system from Google Stitch.
// Semantic color tokens resolve through CSS variables (see index.css) so a
// single utility class (e.g. `bg-background`) renders correctly in both
// themes. Variables hold space-separated RGB channels so Tailwind's
// `/<alpha-value>` opacity modifier (e.g. `bg-surface/90`) keeps working.
const semantic = (name) => `rgb(var(--${name}) / <alpha-value>)`;

const semanticColors = Object.fromEntries(
  [
    'surface', 'surface-dim', 'surface-bright',
    'surface-container-lowest', 'surface-container-low', 'surface-container',
    'surface-container-high', 'surface-container-highest',
    'on-surface', 'on-surface-variant', 'inverse-surface', 'inverse-on-surface',
    'outline', 'outline-variant', 'surface-tint', 'surface-variant',
    'primary', 'on-primary', 'primary-container', 'on-primary-container', 'inverse-primary',
    'secondary', 'on-secondary', 'secondary-container', 'on-secondary-container',
    'tertiary', 'on-tertiary', 'tertiary-container', 'on-tertiary-container',
    'error', 'on-error', 'error-container', 'on-error-container',
    'primary-fixed', 'primary-fixed-dim', 'on-primary-fixed', 'on-primary-fixed-variant',
    'secondary-fixed', 'secondary-fixed-dim', 'on-secondary-fixed', 'on-secondary-fixed-variant',
    'tertiary-fixed', 'tertiary-fixed-dim', 'on-tertiary-fixed', 'on-tertiary-fixed-variant',
    'background', 'on-background',
    'trust-emerald', 'alert-orange', 'border-subtle',
  ].map((t) => [t, semantic(t)])
);

export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ...semanticColors,
        // --- legacy palette (kept so un-converted pages keep rendering) ---
        // `DEFAULT` keeps the semantic `bg-primary`/`text-primary` working while
        // the numeric scale serves un-converted pages (`bg-primary-600`, etc.).
        primary: {
          DEFAULT: semantic('primary'),
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
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'display-lg': ['48px', { lineHeight: '56px', letterSpacing: '-0.02em', fontWeight: '700' }],
        'headline-xl': ['48px', { lineHeight: '56px', letterSpacing: '-0.02em', fontWeight: '700' }],
        'headline-lg': ['32px', { lineHeight: '40px', letterSpacing: '-0.01em', fontWeight: '700' }],
        'headline-lg-mobile': ['24px', { lineHeight: '32px', fontWeight: '700' }],
        'headline-md': ['24px', { lineHeight: '32px', fontWeight: '600' }],
        'headline-sm': ['20px', { lineHeight: '28px', fontWeight: '600' }],
        'body-lg': ['18px', { lineHeight: '28px', fontWeight: '400' }],
        'body-md': ['16px', { lineHeight: '24px', fontWeight: '400' }],
        'body-sm': ['14px', { lineHeight: '20px', fontWeight: '400' }],
        'label-md': ['14px', { lineHeight: '16px', letterSpacing: '0.05em', fontWeight: '600' }],
        'label-sm': ['12px', { lineHeight: '16px', fontWeight: '500' }],
      },
      spacing: {
        base: '4px',
        xs: '4px',
        sm: '8px',
        md: '16px',
        lg: '24px',
        xl: '32px',
        '2xl': '48px',
        '3xl': '64px',
        'gutter-mobile': '16px',
        'gutter-desktop': '24px',
      },
      maxWidth: {
        'container-max': '1280px',
      },
      borderRadius: {
        DEFAULT: '0.25rem',
        md: '0.75rem',
        lg: '0.5rem',
        xl: '0.75rem',
        '2xl': '1rem',
        full: '9999px',
      },
    },
  },
  plugins: [],
};
