/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        /* Midnight Navy → Deep Ink surface scale */
        ink: {
          50:  '#F0F2F5',
          100: '#E1E4EB',
          200: '#C3C9D6',
          300: '#A5AEC2',
          400: '#7D89A1',
          500: '#576580',
          600: '#3E4B66',
          700: '#2A3550',
          800: '#1A2340',
          900: '#0E1629',
          950: '#070B17',
        },
        /* Electric Cobalt brand accent */
        brand: {
          50:  '#EEF4FF',
          100: '#DAE6FF',
          200: '#BDD2FF',
          300: '#8FB5FF',
          400: '#5A8EFF',
          500: '#3366FF',
          600: '#1A4FFF',
          700: '#0D3DE6',
          800: '#1033B8',
          900: '#142F91',
          950: '#101D59',
        },
        /* Restrained Teal signal accent */
        teal: {
          50:  '#EFFCFB',
          100: '#D5F6F4',
          200: '#AFECE9',
          300: '#77DDD9',
          400: '#40C5C1',
          500: '#26AAA7',
          600: '#1E8987',
          700: '#1C6D6D',
          800: '#1C5758',
          900: '#1B4949',
          950: '#0A2D2E',
        },
        /* Semantic colors */
        danger:  { 50: '#FFF1F2', 100: '#FFE4E6', 500: '#EF4444', 600: '#DC2626', 700: '#B91C1C' },
        caution: { 50: '#FFFBEB', 100: '#FEF3C7', 500: '#F59E0B', 600: '#D97706', 700: '#B45309' },
        success: { 50: '#F0FDF4', 100: '#DCFCE7', 500: '#22C55E', 600: '#16A34A', 700: '#15803D' },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '0.875rem' }],
      },
      boxShadow: {
        'card':    '0 1px 2px 0 rgba(0,0,0,0.03), 0 1px 6px -1px rgba(0,0,0,0.04)',
        'card-lg': '0 2px 8px -2px rgba(0,0,0,0.06), 0 4px 12px -4px rgba(0,0,0,0.05)',
        'glow':    '0 0 20px -5px rgba(51,102,255,0.15)',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.25rem',
      },
      animation: {
        'fade-in':    'fadeIn 0.4s ease-out',
        'slide-up':   'slideUp 0.35s ease-out',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%':   { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0.7' },
        },
      },
    },
  },
  plugins: [],
}
