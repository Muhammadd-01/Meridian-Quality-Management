/**
 * Tone → class maps for gallery examples. Class names are written out in full
 * so Tailwind's JIT picks them up. Soft and outline variants switch to a
 * lighter shade in dark mode so text keeps its contrast.
 */
export const TONES = ['primary', 'success', 'warning', 'danger', 'info', 'accent'];

export const TONE_LABEL = {
  primary: 'Primary', success: 'Success', warning: 'Warning', danger: 'Danger', info: 'Info', accent: 'Accent', gray: 'Neutral', dark: 'Dark',
};

/** Solid fill with white text (fixed shades, readable in both themes). */
export const SOLID = {
  primary: 'bg-primary-600 text-white',
  success: 'bg-success-600 text-white',
  warning: 'bg-warning-600 text-white',
  danger: 'bg-danger-600 text-white',
  info: 'bg-info-600 text-white',
  accent: 'bg-accent-600 text-white',
  gray: 'bg-gray-600 text-surface-raised',
  dark: 'bg-[#14201c] text-white',
};

/** Tinted surface + toned border; body text stays neutral. */
export const SOFT = {
  primary: 'bg-primary-50 border-primary-500/30',
  success: 'bg-success-50 border-success-500/30',
  warning: 'bg-warning-50 border-warning-500/30',
  danger: 'bg-danger-50 border-danger-500/30',
  info: 'bg-info-50 border-info-500/30',
  accent: 'bg-accent-50 border-accent-500/30',
  gray: 'bg-gray-50 border-gray-300',
  dark: 'bg-gray-100 border-gray-300',
};

/** Toned text: 600 in light mode, 300 in dark mode. */
export const TEXT = {
  primary: 'text-primary-600 [[data-theme=dark]_&]:text-primary-300',
  success: 'text-success-600 [[data-theme=dark]_&]:text-success-300',
  warning: 'text-warning-700 [[data-theme=dark]_&]:text-warning-300',
  danger: 'text-danger-600 [[data-theme=dark]_&]:text-danger-300',
  info: 'text-info-600 [[data-theme=dark]_&]:text-info-300',
  accent: 'text-accent-600 [[data-theme=dark]_&]:text-accent-300',
  gray: 'text-gray-600',
  dark: 'text-gray-900',
};

export const BORDER = {
  primary: 'border-primary-500',
  success: 'border-success-500',
  warning: 'border-warning-500',
  danger: 'border-danger-500',
  info: 'border-info-500',
  accent: 'border-accent-500',
  gray: 'border-gray-400',
  dark: 'border-gray-800',
};

/** Badge classes from src/styles/index.css. */
export const BADGE = {
  primary: 'badge-primary', success: 'badge-success', warning: 'badge-warning', danger: 'badge-danger', info: 'badge-info', accent: 'badge-accent', gray: 'badge-secondary',
};

/** Hex values from tailwind.config.js, for charts and inline swatches. */
export const HEX = {
  primary: '#24997c', success: '#1e9e6b', warning: '#dc9a2c', danger: '#d0504c', info: '#3e7ead', accent: '#c4901d', gray: '#8f9893',
};
