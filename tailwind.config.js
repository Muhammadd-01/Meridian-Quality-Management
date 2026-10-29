/** @type {import('tailwindcss').Config} */

// Theme-aware colours are CSS variables (RGB triplets) defined for light and
// dark mode in src/styles/index.css, so every utility (bg-gray-50,
// text-gray-800, bg-primary-50, …) follows the active theme automatically.
const v = (name) => `rgb(var(--c-${name}) / <alpha-value>)`;

const scale = (name, fixed) => ({
  50: v(`${name}-50`),
  100: v(`${name}-100`),
  ...fixed,
});

// Lean Six Sigma Consulting palette
//   Core brand   black #071A1F · teal #093F50 · teal 2 #145D68 · teal 3 #1A6A74
//                bright teal #1C7D86 · primrose #F2E6A2 · orange #F78D00 · rust #A45B0B
//   Neutrals     paper #F5F3EC · stone #E8E9E0 · sage #DFE7E3 · soft #C1D2D1
//                soft 2 #9FBAB9 · muted #627579 · ink #102C32 · white
//   Inline       border teal #3B7A84 · pale teal #E2EDEC · gray teal #52676A
//                divider #27434A · divider 2 #1F3D44 · tints #D6E0DF #DBE6E5 #C9D9D8
//
// Roles: `primary` is primrose — the fill colour for buttons, active and selected
// states, tiles and highlights; text on it uses `text-primary-ink`. Primrose is
// too light to read as text on paper, so primary-coloured text and icons use
// `brand` (teal ink in light mode, primrose in dark mode). `teal` is the brand
// teal ramp for avatars, data shades and deep surfaces.
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        gray: {
          50: v('gray-50'),
          100: v('gray-100'),
          200: v('gray-200'),
          300: v('gray-300'),
          400: v('gray-400'),
          500: v('gray-500'),
          600: v('gray-600'),
          700: v('gray-700'),
          800: v('gray-800'),
          900: v('gray-900'),
          950: v('gray-950'),
        },
        primary: scale('primary', {
          200: '#F2E6A2',
          300: '#EADB86',
          400: '#E0CD68',
          500: '#CDB64C',
          600: '#A8923A',
          700: '#7D6C26',
          800: '#5A4E1C',
          900: '#3D3514',
          DEFAULT: '#F2E6A2',
          ink: '#093F50',
        }),
        brand: {
          DEFAULT: v('brand'),
          strong: v('brand-strong'),
        },
        teal: scale('teal', {
          200: '#C1D2D1',
          300: '#9FBAB9',
          400: '#3B7A84',
          500: '#1C7D86',
          600: '#1A6A74',
          700: '#145D68',
          800: '#093F50',
          900: '#07323F',
          950: '#071A1F',
          DEFAULT: '#145D68',
        }),
        primrose: {
          50: '#FBF8E8',
          100: '#F7EFC9',
          200: '#F2E6A2',
          300: '#EADB86',
          400: '#E0CD68',
          500: '#CDB64C',
          600: '#A8923A',
          700: '#7D6C26',
          DEFAULT: '#F2E6A2',
        },
        paper: '#F5F3EC',
        stone: '#E8E9E0',
        ink: '#102C32',
        rust: '#A45B0B',
        secondary: {
          DEFAULT: v('gray-600'),
          50: v('gray-50'),
          100: v('gray-100'),
          200: v('gray-200'),
          300: v('gray-300'),
          400: v('gray-400'),
          500: v('gray-600'),
          600: v('gray-700'),
          700: v('gray-900'),
          800: '#093F50',
        },
        accent: scale('accent', {
          200: '#FFD08A',
          300: '#FFB347',
          400: '#FF9F1F',
          500: '#F78D00',
          600: '#C96F00',
          700: '#A45B0B',
          800: '#7A430A',
          DEFAULT: '#F78D00',
        }),
        success: scale('success', {
          200: '#A6E3BF',
          300: '#6CCB95',
          400: '#2FA96A',
          500: '#1E8C55',
          600: '#187548',
          700: '#145E3B',
          800: '#114A30',
          900: '#0D3825',
          DEFAULT: '#187548',
        }),
        warning: scale('warning', {
          200: '#FFD08A',
          300: '#FFB347',
          400: '#FF9F1F',
          500: '#F78D00',
          600: '#C96F00',
          700: '#A45B0B',
          800: '#7A430A',
          900: '#5C3208',
          DEFAULT: '#C96F00',
        }),
        danger: scale('danger', {
          200: '#F5C2BC',
          300: '#EC9A90',
          400: '#E06C5E',
          500: '#CF4A3B',
          600: '#B83A2C',
          700: '#992E23',
          800: '#7A251D',
          900: '#5E1D17',
          DEFAULT: '#B83A2C',
        }),
        // Info is the palette's bright-teal family.
        info: scale('info', {
          200: '#C1D2D1',
          300: '#9FBAB9',
          400: '#3B7A84',
          500: '#1C7D86',
          600: '#1A6A74',
          700: '#145D68',
          800: '#0C4A58',
          900: '#093F50',
          DEFAULT: '#1C7D86',
        }),
        sidebar: {
          spruce: '#093F50',
          'spruce-active': '#0C4A58',
          'spruce-border': 'rgba(255,255,255,0.06)',
          'spruce-text': 'rgba(255,255,255,0.62)',
        },
        surface: {
          canvas: 'var(--surface-canvas)',
          base: 'var(--surface-base)',
          raised: 'var(--surface-raised)',
          sunken: 'var(--surface-sunken)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', '"Segoe UI"', 'Roboto', '"Helvetica Neue"', 'Arial', 'sans-serif'],
        display: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '0.875rem' }],
      },
      boxShadow: {
        xs: '0 1px 2px rgb(7 26 31 / 0.05)',
        sm: '0 1px 2px rgb(7 26 31 / 0.04), 0 1px 3px rgb(7 26 31 / 0.06)',
        DEFAULT: '0 1px 2px rgb(7 26 31 / 0.04), 0 1px 3px rgb(7 26 31 / 0.06)',
        md: '0 8px 24px -8px rgb(9 63 80 / 0.18), 0 2px 6px rgb(7 26 31 / 0.06)',
        lg: '0 16px 30px -18px rgb(9 63 80 / 0.4), 0 2px 6px rgb(7 26 31 / 0.06)',
        xl: '0 25px 50px -12px rgb(7 26 31 / 0.28)',
        card: '0 1px 2px rgb(7 26 31 / 0.04), 0 1px 3px rgb(7 26 31 / 0.06)',
        'card-hover': '0 22px 40px -22px rgb(9 63 80 / 0.45), 0 0 0 1px rgb(242 230 162 / 0.6)',
        dropdown: '0 30px 60px -25px rgb(9 63 80 / 0.45)',
        modal: '0 25px 50px -12px rgb(7 26 31 / 0.3)',
        button: '0 10px 22px -12px rgb(168 146 58 / 0.75)',
        'glow-primary': '0 10px 22px -10px rgb(205 182 76 / 0.8)',
        'glow-teal': '0 10px 22px -10px rgb(9 63 80 / 0.6)',
        'glow-accent': '0 8px 18px -8px rgb(247 141 0 / 0.9)',
        'glow-danger': '0 8px 24px -6px rgb(184 58 44 / 0.35)',
      },
      // Meridian radii: chips 6px, controls 8px, cards 12px, modals/tiles 16px,
      // CTA bands 24px, hero banners 28px.
      borderRadius: {
        sm: '6px',
        DEFAULT: '8px',
        md: '8px',
        lg: '12px',
        xl: '16px',
        '2xl': '24px',
        '3xl': '28px',
      },
      transitionTimingFunction: {
        spring: 'cubic-bezier(0.22, 1, 0.36, 1)',
        'out-expo': 'cubic-bezier(0.22, 1, 0.36, 1)',
        bounce: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
    },
  },
  plugins: [],
};
