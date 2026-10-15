/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eef8f6',
          100: '#d5eeea',
          200: '#adddd5',
          300: '#79c6ba',
          400: '#4daa9d',
          500: '#3b9b8f',
          600: '#2d7d73',
          700: '#28665e',
          800: '#24524c',
          900: '#224540',
          DEFAULT: '#40BFA6',
        },
        secondary: {
          DEFAULT: '#6c757d',
          50: '#f8f9fa',
          100: '#e9ecef',
          200: '#dee2e6',
          300: '#ced4da',
          400: '#adb5bd',
          500: '#6c757d',
          600: '#495057',
          700: '#343a40',
          800: '#212529',
        },
        accent: {
          DEFAULT: '#7c5cfc',
          50: '#f0edff',
          100: '#e0d9ff',
          200: '#c4b5ff',
          300: '#a08aff',
          400: '#7c5cfc',
          500: '#6a4df0',
          600: '#5a3dd4',
        },
        success: { DEFAULT: '#28a745', 50: '#ecfdf5', 100: '#d1fae5', 500: '#28a745', 600: '#16a34a' },
        danger: { DEFAULT: '#dc3545', 50: '#fef2f2', 100: '#fee2e2', 500: '#dc3545', 600: '#dc2626' },
        warning: { DEFAULT: '#ffc107', 50: '#fffbeb', 100: '#fef3c7', 500: '#ffc107', 600: '#d97706' },
        info: { DEFAULT: '#17a2b8', 50: '#ecfeff', 100: '#cffafe', 500: '#17a2b8', 600: '#0891b2' },
        sidebar: {
          bg: '#141414',
          hover: 'rgba(255,255,255,0.06)',
          active: 'rgba(255,255,255,0.1)',
          border: 'rgba(255,255,255,0.08)',
          text: 'rgba(255,255,255,0.6)',
          'text-active': '#ffffff',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '0.875rem' }],
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgb(0 0 0 / 0.05), 0 1px 2px -1px rgb(0 0 0 / 0.05)',
        'card-hover': '0 4px 6px -1px rgb(0 0 0 / 0.07), 0 2px 4px -2px rgb(0 0 0 / 0.07)',
        'dropdown': '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
        'modal': '0 20px 25px -5px rgb(0 0 0 / 0.15), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
      },
      borderRadius: {
        'xl': '0.75rem',
        '2xl': '1rem',
      },
    },
  },
  plugins: [],
};
