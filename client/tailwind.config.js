/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Grounded editorial commerce palette
        ink: {
          50: '#f6f5f3',
          100: '#eae7e2',
          200: '#d9d4cc',
          300: '#c1b9ad',
          400: '#a39a8c',
          500: '#857b6d',
          600: '#6b6256',
          700: '#544d44',
          800: '#33302a',
          900: '#1e1c19',
          950: '#131210',
        },
        canvas: '#FAF8F4',
        canvasd: '#F1EDE5',
        line: '#E7E2D9',
        clay: {
          50: '#fdf5f2',
          100: '#fae8e0',
          500: '#C25E43',
          600: '#A94A32',
          700: '#8C3B26',
        },
        // Legacy alias kept so existing class names keep working during migration
        brand: {
          50: '#f6f5f3',
          100: '#eae7e2',
          200: '#d9d4cc',
          300: '#544d44',
          400: '#33302a',
          500: '#1e1c19',
          600: '#33302a',
          700: '#544d44',
          800: '#6b6256',
          900: '#857b6d',
          950: '#1e1c19',
        },
        dark: {
          800: '#33302a',
          850: '#1e1c19',
          900: '#131210',
          950: '#131210',
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
        display: ['"Outfit"', 'sans-serif'],
        heading: ['"Bebas Neue"', 'Impact', 'sans-serif']
      },
      letterSpacing: {
        wideplus: '0.12em',
      },
      boxShadow: {
        'card': '0 1px 2px rgba(30, 28, 25, 0.06)',
        'card-hover': '0 10px 30px -12px rgba(30, 28, 25, 0.18)',
        'panel': '0 1px 3px rgba(30, 28, 25, 0.08)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.5s ease-out both',
      },
    },
  },
  plugins: [],
}
