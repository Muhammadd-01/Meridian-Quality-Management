import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Loader2, MailCheck, RotateCw, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../lib/auth';
import { friendlyMessage } from '../../lib/errors';

const RESEND_COOLDOWN = 60; // Supabase allows one code email about every 60 seconds

const fmt = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

/**
 * Second sign-in step: the code Supabase emailed. One box per digit; typing
 * moves to the next box, Backspace goes back, pasting the whole code fills
 * every box, and the code is checked as soon as the last digit is entered.
 */
export default function OtpStep({ otp: initial, remember, onVerified, onBack }) {
  const { verifyOtp, resendOtp } = useAuth();
  const [otp, setOtp] = useState(initial);
  const length = otp.codeLength || 6;
  const [digits, setDigits] = useState(() => Array(length).fill(''));
  const [error, setError] = useState('');
  const [shake, setShake] = useState(0);
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN);
  const [expiresAt, setExpiresAt] = useState(() => Date.now() + (initial.expiresIn || 600) * 1000);
  const [now, setNow] = useState(Date.now());
  const inputs = useRef([]);

  useEffect(() => { inputs.current[0]?.focus(); }, []);

  useEffect(() => {
    const t = setInterval(() => {
      setNow(Date.now());
      setCooldown(c => (c > 0 ? c - 1 : 0));
    }, 1000);
    return () => clearInterval(t);
  }, []);

  const secondsLeft = Math.max(0, Math.round((expiresAt - now) / 1000));
  const expired = secondsLeft === 0;

  const submit = async (code) => {
    if (verifying || code.length !== length) return;
    setVerifying(true);
    setError('');
    try {
      const user = await verifyOtp(otp.challenge, code, remember);
      onVerified(user);
    } catch (err) {
      setVerifying(false);
      setError(friendlyMessage(err, 'That code didn’t work. Please try again.'));
      setShake(s => s + 1);
      setDigits(Array(length).fill(''));
      setTimeout(() => inputs.current[0]?.focus(), 0);
      if (err.code === 'otp_challenge_expired') setExpiresAt(Date.now());
    }
  };

  const setAt = (index, value) => {
    const clean = value.replace(/\D/g, '');
    if (!clean) {
      setDigits(d => d.map((x, i) => (i === index ? '' : x)));
      return;
    }
    // Typing or pasting several digits fills the following boxes too.
    const next = [...digits];
    clean.slice(0, length - index).split('').forEach((ch, k) => { next[index + k] = ch; });
    setDigits(next);
    setError('');
    const filled = Math.min(index + clean.length, length - 1);
    inputs.current[filled]?.focus();
    if (next.every(Boolean)) submit(next.join(''));
  };

  const onKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      e.preventDefault();
      inputs.current[index - 1]?.focus();
      setDigits(d => d.map((x, i) => (i === index - 1 ? '' : x)));
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      inputs.current[index + 1]?.focus();
    } else if (e.key === 'Enter') {
      submit(digits.join(''));
    }
  };

  const onPaste = (e) => {
    const text = e.clipboardData.getData('text').replace(/\D/g, '');
    if (!text) return;
    e.preventDefault();
    setAt(0, text);
  };

  const resend = async () => {
    if (cooldown > 0 || resending) return;
    setResending(true);
    setError('');
    try {
      const next = await resendOtp(otp.challenge);
      setOtp(next);
      setExpiresAt(Date.now() + (next.expiresIn || 600) * 1000);
      setCooldown(RESEND_COOLDOWN);
      setDigits(Array(length).fill(''));
      inputs.current[0]?.focus();
    } catch (err) {
      setError(friendlyMessage(err, 'We couldn’t send a new code. Please try again shortly.'));
      if (err.status === 429) setCooldown(RESEND_COOLDOWN);
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="auth-form space-y-5 animate-fade-in">
      <div className="flex items-start gap-3 rounded-xl bg-primary-50 border border-primary-200 p-3.5">
        <span className="grid place-items-center w-10 h-10 rounded-lg bg-primary-100 text-brand shrink-0"><MailCheck size={18} aria-hidden="true" /></span>
        <p className="text-[13px] text-gray-700 leading-snug">
          We sent a {length}-digit code to <strong className="text-gray-900">{otp.email}</strong>. Enter it below to finish signing in.
        </p>
      </div>

      <div>
        <div key={shake} className={`flex justify-center gap-2 ${shake ? 'animate-shake' : ''}`} onPaste={onPaste} role="group" aria-label="Verification code">
          {digits.map((d, i) => (
            <input
              key={i}
              ref={el => { inputs.current[i] = el; }}
              value={d}
              onChange={(e) => setAt(i, e.target.value)}
              onKeyDown={(e) => onKeyDown(i, e)}
              onFocus={(e) => e.target.select()}
              inputMode="numeric"
              autoComplete={i === 0 ? 'one-time-code' : 'off'}
              maxLength={length}
              disabled={verifying || expired}
              aria-label={`Digit ${i + 1} of ${length}`}
              className={`w-11 h-12 sm:w-12 sm:h-14 text-center text-xl font-extrabold rounded-xl border-2 bg-white text-gray-900 outline-none transition-all duration-150
                focus:border-primary-500 focus:ring-4 focus:ring-primary-200/60 disabled:opacity-60
                ${error ? 'border-danger-300' : d ? 'border-primary-400' : 'border-gray-200'}`}
            />
          ))}
        </div>
        {error && <p role="alert" className="form-error text-center mt-3">{error}</p>}
      </div>

      <button type="button" onClick={() => submit(digits.join(''))} disabled={verifying || expired || digits.some(x => !x)} className="btn-primary w-full !py-3 !text-sm !rounded-xl">
        {verifying ? <><Loader2 size={16} className="animate-spin" aria-hidden="true" /> Verifying…</> : <><ShieldCheck size={16} aria-hidden="true" /> Verify and sign in</>}
      </button>

      <div className="flex items-center justify-between gap-3 text-[12.5px]">
        <button type="button" onClick={onBack} className="inline-flex items-center gap-1 font-semibold text-gray-500 hover:text-gray-800 transition-colors">
          <ArrowLeft size={14} aria-hidden="true" /> Use a different account
        </button>
        <button type="button" onClick={resend} disabled={cooldown > 0 || resending} className="inline-flex items-center gap-1 font-semibold text-brand hover:text-brand-strong disabled:text-gray-400 transition-colors">
          <RotateCw size={13} className={resending ? 'animate-spin' : ''} aria-hidden="true" />
          {cooldown > 0 ? `Resend code in ${cooldown}s` : 'Resend code'}
        </button>
      </div>

      <p className={`text-center text-[12px] ${expired ? 'text-danger-600 font-semibold' : 'text-gray-400'}`}>
        {expired ? 'This code has expired. Send a new code or sign in again.' : `Code expires in ${fmt(secondsLeft)}`}
      </p>
    </div>
  );
}
