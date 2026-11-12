/**
 * The signed-in user's OWN connected email (Settings → Email), shared by every
 * email button so it is fetched once. Cleared and fetched again when a
 * different person signs in, so nobody sees another person's account.
 */
import { useEffect, useState } from 'react';
import { api } from './api';
import { getSession, subscribeSession } from './session';

let account = null; // { connected, email?, displayName?, provider?, ... } | { connected: false, unavailable: true }
let accountUserId = null;
let loading = null;
const listeners = new Set();
const currentUserId = () => getSession()?.user?.id ?? null;

function set(next, userId = currentUserId()) {
  if (userId !== currentUserId()) return;
  account = next;
  accountUserId = userId;
  listeners.forEach(fn => fn(account));
}

export function refreshEmailAccount() {
  const userId = currentUserId();
  if (!userId) return Promise.resolve();
  loading ??= api.get('/email/account')
    .then(a => set(a || { connected: false }, userId))
    .catch(err => set({ connected: false, unavailable: true, message: err?.message }, userId))
    .finally(() => { loading = null; });
  return loading;
}

export const setEmailAccount = (next) => set(next);

subscribeSession((session) => {
  const userId = session?.user?.id ?? null;
  if (userId === accountUserId) return;
  account = null;
  accountUserId = null;
  loading = null;
  listeners.forEach(fn => fn(null));
  if (userId && listeners.size) refreshEmailAccount();
});

export function useEmailAccount() {
  const userId = currentUserId();
  const [value, setValue] = useState(accountUserId === userId ? account : null);
  useEffect(() => {
    listeners.add(setValue);
    if (!account || accountUserId !== currentUserId()) {
      setValue(null);
      refreshEmailAccount();
    } else {
      setValue(account);
    }
    return () => listeners.delete(setValue);
  }, [userId]);
  return accountUserId === userId ? value : null;
}

/** Provider presets shown in Settings (the server applies the real settings). */
export const EMAIL_PROVIDERS = [
  { id: 'gmail', label: 'Gmail', domains: ['gmail.com', 'googlemail.com'], help: 'Google Account → Security → 2-Step Verification → App passwords.', helpUrl: 'https://myaccount.google.com/apppasswords' },
  { id: 'outlook', label: 'Outlook / Hotmail', domains: ['outlook.com', 'hotmail.com', 'live.com', 'msn.com'], help: 'Microsoft account → Security → Advanced security options → App passwords (requires two-step verification).', helpUrl: 'https://account.live.com/proofs/AppPassword' },
  { id: 'office365', label: 'Microsoft 365 (work)', domains: [], help: 'Your IT admin must allow “SMTP AUTH” for your mailbox; use your mailbox password or an app password.' },
  { id: 'yahoo', label: 'Yahoo Mail', domains: ['yahoo.com', 'ymail.com'], help: 'Yahoo Account security → Generate app password.', helpUrl: 'https://login.yahoo.com/account/security' },
  { id: 'zoho', label: 'Zoho Mail', domains: ['zoho.com', 'zohomail.com'], help: 'Zoho Mail → Settings → Security → App passwords.' },
  { id: 'custom', label: 'Other (company mail server)', domains: [], help: 'Ask your IT team or hosting provider for the SMTP server, port and security.' },
];

/** Picks the provider from an email address (company domains → "custom"). */
export function guessProvider(email) {
  const domain = String(email || '').split('@')[1]?.toLowerCase();
  return EMAIL_PROVIDERS.find(p => p.domains.includes(domain))?.id || (domain ? 'custom' : 'gmail');
}
