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
          50: '#eef8f5',
          100: '#cbe7de',
          200: '#9dd1c1',
          300: '#69b59f',
          400: '#3d9980',
          500: '#1e7f67',
          600: '#176b56',
          700: '#125544',
          800: '#0f4437',
          900: '#0c382e',
          DEFAULT: '#176b56', // Slightly darker rich emerald teal for buttons and active states
        },
        secondary: {
          DEFAULT: '#5a625c',
          50: '#f7f8f7',
          100: '#eff1f0',
          200: '#e4e7e5',
          300: '#d8dcd9',
          400: '#adb5bd',
          500: '#5a625c',
          600: '#495057',
          700: '#1e211f',
          800: '#14201c',
        },
        accent: {
          DEFAULT: '#f8a22c',
          50: '#fdf7e7',
          100: '#faebc0',
          200: '#f3d785',
          300: '#e9be4e',
          400: '#f8a22c',
          500: '#c4901d',
          600: '#a17517',
        },
        sidebar: {
          spruce: '#14201c',
          'spruce-active': '#1b2b25',
          'spruce-border': 'rgba(255,255,255,0.08)',
          'spruce-text': 'rgba(255,255,255,0.7)',
        },
        success: { DEFAULT: '#176b56', 50: '#eef8f5', 100: '#cbe7de', 500: '#176b56', 600: '#125544' },
        danger: { DEFAULT: '#dc3545', 50: '#fef2f2', 100: '#fee2e2', 500: '#dc3545', 600: '#dc2626' },
        warning: { DEFAULT: '#f8a22c', 50: '#fdf7e7', 100: '#fef3c7', 500: '#f8a22c', 600: '#d97706' },
        info: { DEFAULT: '#17a2b8', 50: '#ecfeff', 100: '#cffafe', 500: '#17a2b8', 600: '#0891b2' },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '0.875rem' }],
      },
      boxShadow: {
        'xs': '0 1px 2px 0 rgb(0 0 0 / 0.04)',
        'card': '0 1px 3px 0 rgb(0 0 0 / 0.04), 0 1px 2px -1px rgb(0 0 0 / 0.04)',
        'card-hover': '0 4px 12px -2px rgb(0 0 0 / 0.06), 0 2px 4px -2px rgb(0 0 0 / 0.04)',
        'dropdown': '0 10px 25px -4px rgb(0 0 0 / 0.08), 0 4px 6px -4px rgb(0 0 0 / 0.04)',
        'modal': '0 20px 25px -5px rgb(0 0 0 / 0.12), 0 8px 10px -6px rgb(0 0 0 / 0.08)',
      },
      borderRadius: {
        'xl': '0.75rem',
        '2xl': '1rem',
      },
    },
  },
  plugins: [],
};
