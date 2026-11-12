/**
 * Phone numbers for team members: accepts what people type (0300 1234567,
 * 0092 300…, +92-300-…) and stores one international form (+923001234567),
 * which is also what WhatsApp links need.
 *
 * Whether a number really has a WhatsApp account can only be checked through
 * Meta's paid WhatsApp Business API. Here a number is "WhatsApp-ready" when it
 * is a complete mobile number; WhatsApp itself reports if the person isn't on it.
 */
import { countryOfPhone } from '../data/countries.js';

export const DEFAULT_COUNTRY_CODE = '92'; // Pakistan

const E164 = /^\+[1-9]\d{7,14}$/;

/** International form (+923001234567), or null when it can't be a valid number. Empty input → ''. */
export function normalizePhone(input, countryCode = DEFAULT_COUNTRY_CODE) {
  const raw = String(input ?? '').trim();
  if (!raw) return '';
  let s = raw.replace(/[\s\-().]/g, '');
  if (s.startsWith('00')) s = `+${s.slice(2)}`;
  else if (s.startsWith('0')) s = `+${countryCode}${s.slice(1)}`;
  else if (!s.startsWith('+')) s = s.startsWith(countryCode) && s.length >= 11 ? `+${s}` : `+${countryCode}${s}`;
  return E164.test(s) ? s : null;
}

/**
 * @returns {{ status: 'empty'|'invalid'|'landline'|'ready', phone: string|null, display: string, message: string }}
 */
export function checkPhone(input, countryCode = DEFAULT_COUNTRY_CODE) {
  const phone = normalizePhone(input, countryCode);
  if (phone === '') return { status: 'empty', phone: '', display: '', message: '' };
  if (phone === null) return { status: 'invalid', phone: null, display: '', message: 'This doesn’t look like a complete phone number.' };
  const display = formatPhone(phone);
  // Pakistani mobiles are +92 3xx xxxxxxx; other +92 numbers are landlines (no WhatsApp).
  if (phone.startsWith('+92') && !/^\+923\d{9}$/.test(phone)) {
    return { status: 'landline', phone, display, message: 'Looks like a landline, so WhatsApp sharing won’t be available.' };
  }
  return { status: 'ready', phone, display, message: 'WhatsApp-ready' };
}

export const isWhatsAppReady = (phone) => checkPhone(phone).status === 'ready';

/** +923001234567 → "+92 300 1234567"; other countries: "+971 50 123 4567"-style groups after the dial code. */
export function formatPhone(phone) {
  if (!phone) return '';
  const m = /^\+92(3\d{2})(\d{7})$/.exec(phone);
  if (m) return `+92 ${m[1]} ${m[2]}`;
  const digits = phone.replace(/^\+/, '');
  const dial = countryOfPhone(phone)?.dial || digits.slice(0, 2);
  const national = digits.slice(dial.length).replace(/(\d{3})(?=\d{4,})/g, '$1 ');
  return `+${dial} ${national}`.trim();
}

/** Splits +971501234567 into { iso: 'AE', national: '501234567' } for the phone field. */
export function splitPhone(phone, fallbackIso = 'PK') {
  const country = countryOfPhone(phone);
  if (!phone || !country) return { iso: fallbackIso, national: '' };
  return { iso: country.iso, national: phone.replace(/^\+/, '').slice(country.dial.length) };
}

/** Opens a WhatsApp chat (app or web) with the message typed in, ready to send. */
export function whatsappLink(phone, text = '') {
  const digits = String(phone || '').replace(/\D/g, '');
  return `https://wa.me/${digits}${text ? `?text=${encodeURIComponent(text)}` : ''}`;
}

/** The sign-in details message sent to a new team member. */
export function signInDetailsMessage({ fullName, email, password, role, loginUrl }) {
  const first = String(fullName || '').trim().split(/\s+/)[0] || 'there';
  return [
    `Hi ${first}, your Meridian CRM account is ready.`,
    '',
    `Role: ${role}`,
    `Sign in: ${loginUrl}`,
    `Email: ${email}`,
    `Temporary password: ${password}`,
    '',
    'After signing in, please change your password in Settings → Change password.',
  ].join('\n');
}
