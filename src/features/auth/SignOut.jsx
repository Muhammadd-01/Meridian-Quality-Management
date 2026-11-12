import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MeridianLoader, { LoadingDots } from '../../components/ui/MeridianLoader';
import { useAuth } from '../../lib/auth';

const MIN_SIGNING_MS = 900; // long enough to read, short enough not to wait
const DONE_MS = 850;

/**
 * Sign-out screen on the brand background: "Signing you out…" with the
 * Meridian loader, then a check mark that draws itself, then the sign-in page.
 */
export default function SignOut() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [done, setDone] = useState(false);

  useEffect(() => {
    let active = true;
    const started = Date.now();
    let timer;
    logout().finally(() => {
      const wait = Math.max(0, MIN_SIGNING_MS - (Date.now() - started));
      timer = setTimeout(() => {
        if (!active) return;
        setDone(true);
        timer = setTimeout(() => { if (active) navigate('/login', { replace: true }); }, DONE_MS);
      }, wait);
    });
    return () => { active = false; clearTimeout(timer); };
  }, [logout, navigate]);

  return (
    <div className="fixed inset-0 z-[200] grid place-items-center hero-spruce hero-grid text-white animate-fade-in" role="status" aria-live="polite">
      <span className="hero-orb w-[520px] h-[520px] -top-48 -right-40 bg-[radial-gradient(circle,rgba(242,230,162,0.22),transparent_70%)]" aria-hidden="true" />
      <span className="hero-orb w-[460px] h-[460px] -bottom-56 -left-32 bg-[radial-gradient(circle,rgba(28,125,134,0.4),transparent_70%)]" aria-hidden="true" />
      <div className="relative flex flex-col items-center text-center px-6">
        <img src="/brand/meridian-logo-on-dark.png" alt="Meridian Quality Management Professionals" width="570" height="247" className="h-16 w-auto mb-8 opacity-95" />
        <div className="h-[92px] grid place-items-center">
          {done ? (
            <svg viewBox="0 0 60 60" width="84" height="84" className="signout-check animate-scale-in" aria-hidden="true">
              <circle cx="30" cy="30" r="25" fill="none" stroke="var(--color-primrose)" strokeWidth="3.5" />
              <path d="M19 31 l7.5 7.5 L41 23" fill="none" stroke="var(--color-primrose)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ) : (
            <MeridianLoader size={84} tone="dark" label="Signing you out" />
          )}
        </div>
        <p className="mt-6 text-lg font-extrabold tracking-tight">
          {done ? 'You’re signed out' : <>Signing you out<LoadingDots /></>}
        </p>
        <p className="mt-1.5 text-sm text-white/60">{done ? 'See you soon.' : 'Ending your session safely'}</p>
      </div>
    </div>
  );
}
