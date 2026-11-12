import React, { useEffect, useState } from 'react';
import { Eye, EyeOff, Loader2, MailCheck, RotateCw, Send, ShieldCheck, Check, X } from 'lucide-react';
import { useToast } from '../../components/ui/Toast';
import { api } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { friendlyMessage } from '../../lib/errors';

const RESEND_COOLDOWN = 60;

const RULES = [
  { label: 'At least 8 characters', test: (p) => p.length >= 8 },
  { label: 'Upper and lower case letters', test: (p) => /[a-z]/.test(p) && /[A-Z]/.test(p) },
  { label: 'A number', test: (p) => /\d/.test(p) },
  { label: 'A symbol (e.g. ! @ # %)', test: (p) => /[^A-Za-z0-9]/.test(p) },
];

// Same rule as the server: 8+ characters and three of lower, upper, digit, symbol.
function passwordProblem(p) {
  if (p.length < 8) return 'The new password must be at least 8 characters.';
  const classes = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter(re => re.test(p)).length;
  return classes < 3 ? 'Use at least three of: lower case, upper case, a number, a symbol.' : '';
}

/**
 * Change password in two steps: a 6-digit code is emailed to you, then you
 * enter it together with the new password. The server checks the code first.
 */
export default function ChangePassword() {
  const { user } = useAuth();
  const addToast = useToast();
  const [step, setStep] = useState('start'); // 'start' | 'code'
  const [sending, setSending] = useState(false);
  const [saving, setSaving] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (cooldown <= 0) return undefined;
    const t = setTimeout(() => setCooldown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const sendCode = async () => {
    if (sending || cooldown > 0) return;
    setSending(true);
    setError('');
    try {
      await api.post('/users/me/password/code');
      setStep('code');
      setCooldown(RESEND_COOLDOWN);
      addToast({ title: 'Code sent', message: `Check ${user?.email || 'your inbox'} for a 6-digit code.` }, 'info');
    } catch (err) {
      setError(friendlyMessage(err, 'We couldn’t send the code. Please try again shortly.'));
      if (err.status === 429) setCooldown(RESEND_COOLDOWN);
    } finally {
      setSending(false);
    }
  };

  const reset = () => {
    setStep('start');
    setCode('');
    setPassword('');
    setConfirm('');
    setError('');
  };

  const submit = async (e) => {
    e.preventDefault();
    const digits = code.replace(/\D/g, '');
    if (digits.length < 6) { setError('Enter the code from the email.'); return; }
    const problem = passwordProblem(password);
    if (problem) { setError(problem); return; }
    if (password !== confirm) { setError('The two passwords don’t match.'); return; }
    setSaving(true);
    setError('');
    try {
      await api.post('/users/me/password', { code: digits, newPassword: password });
      addToast({ title: 'Password changed', message: 'Use your new password the next time you sign in.' }, 'success');
      reset();
    } catch (err) {
      setError(friendlyMessage(err, 'Your password wasn’t changed. Please try again.'));
    } finally {
      setSaving(false);
    }
  };

  if (step === 'start') {
    return (
      <div className="space-y-3">
        <p className="text-sm text-gray-600">
          To keep your account safe, we’ll email a 6-digit code to <strong className="text-gray-800">{user?.email}</strong> before you choose a new password.
        </p>
        {error && <p role="alert" className="form-error">{error}</p>}
        <button type="button" className="btn-primary" onClick={sendCode} disabled={sending || cooldown > 0}>
          {sending ? <><Loader2 size={14} className="animate-spin" aria-hidden="true" /> Sending…</> : <><Send size={14} aria-hidden="true" /> {cooldown > 0 ? `Send code in ${cooldown}s` : 'Send code'}</>}
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4 animate-fade-in" noValidate>
      <div className="flex items-start gap-3 rounded-xl bg-primary-50 border border-primary-200 p-3">
        <MailCheck size={18} className="text-brand mt-0.5 shrink-0" aria-hidden="true" />
        <p className="text-[13px] text-gray-700">We sent a code to <strong className="text-gray-900">{user?.email}</strong>. It’s valid for 1 hour.</p>
      </div>

      <div>
        <label htmlFor="pw-code" className="form-label">Code from the email *</label>
        <input
          id="pw-code"
          className="form-input font-mono tracking-[0.35em] text-lg"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={10}
          value={code}
          onChange={(e) => { setCode(e.target.value.replace(/\D/g, '')); setError(''); }}
          placeholder="••••••"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label htmlFor="pw-new" className="form-label">New password *</label>
          <div className="relative">
            <input id="pw-new" type={show ? 'text' : 'password'} autoComplete="new-password" className="form-input pr-10" value={password} onChange={(e) => { setPassword(e.target.value); setError(''); }} />
            <button type="button" onClick={() => setShow(s => !s)} className="absolute right-2 top-1/2 -translate-y-1/2 btn-icon w-7 h-7" aria-label={show ? 'Hide passwords' : 'Show passwords'} aria-pressed={show}>
              {show ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
        </div>
        <div>
          <label htmlFor="pw-confirm" className="form-label">Confirm new password *</label>
          <input id="pw-confirm" type={show ? 'text' : 'password'} autoComplete="new-password" className="form-input" value={confirm} onChange={(e) => { setConfirm(e.target.value); setError(''); }} />
          {confirm && password !== confirm && <p className="text-2xs text-danger-600 mt-1">Doesn’t match yet.</p>}
        </div>
      </div>

      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">
        {RULES.map(r => {
          const ok = r.test(password);
          return (
            <li key={r.label} className={`flex items-center gap-1.5 text-2xs ${ok ? 'text-success-700' : 'text-gray-400'}`}>
              {ok ? <Check size={12} aria-hidden="true" /> : <X size={12} aria-hidden="true" />} {r.label}
            </li>
          );
        })}
      </ul>

      {error && <p role="alert" className="form-error">{error}</p>}

      <div className="flex flex-wrap items-center gap-2">
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? <><Loader2 size={14} className="animate-spin" aria-hidden="true" /> Changing…</> : <><ShieldCheck size={14} aria-hidden="true" /> Change password</>}
        </button>
        <button type="button" className="btn-secondary" onClick={sendCode} disabled={sending || cooldown > 0}>
          <RotateCw size={13} className={sending ? 'animate-spin' : ''} aria-hidden="true" /> {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}
        </button>
        <button type="button" className="btn-ghost" onClick={reset}>Cancel</button>
      </div>
    </form>
  );
}
