import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { api } from './api';
import { getSession, setSession, clearSession, subscribeSession } from './session';
import { clearRemoteCaches, loadRemoteCollection } from './remoteCollections';
import { getStorageItem, setStorageItem } from './storage';
import { SETTINGS_KEY, mergeSettings } from './settings';
import { ENTITY_LIST } from '../data/entities';
import { useToast } from '../components/ui/Toast';
import { HOME_PATH } from '../app/features';
import { can as roleCan } from './permissions';

const REMOTE_ENTITIES = ENTITY_LIST.filter((e) => e.remote);
const LAST_USER_KEY = 'mqm.auth.last-user';
const AuthContext = createContext(null);

/** Show the signed-in person in the top bar, sidebar and audit history. */
function applyProfile(user) {
  if (!user) return;
  const stored = getStorageItem(SETTINGS_KEY, null);
  const current = mergeSettings(stored);
  setStorageItem(SETTINGS_KEY, {
    ...(stored || {}),
    profile: { ...current.profile, name: user.fullName || current.profile.name, email: user.email, title: user.role || current.profile.title },
  });
}

/** A different account must never see the previous account's cached records. */
function onSignedIn(session) {
  let lastUser = null;
  try { lastUser = localStorage.getItem(LAST_USER_KEY); } catch { /* ignore */ }
  if (lastUser !== session.user.id) clearRemoteCaches(REMOTE_ENTITIES);
  try { localStorage.setItem(LAST_USER_KEY, session.user.id); } catch { /* ignore */ }
  applyProfile(session.user);
}

export function AuthProvider({ children }) {
  const [session, setState] = useState(getSession);
  const addToast = useToast();

  useEffect(() => subscribeSession((next, reason) => {
    setState(next);
    if (reason === 'expired') addToast('Your session has expired. Please sign in again.', 'info');
  }), [addToast]);

  // Warm every server-backed collection once signed in, so global search,
  // dashboard and reports see real data even before their page is opened.
  const userId = session?.user?.id;
  useEffect(() => {
    if (userId) REMOTE_ENTITIES.forEach((entity) => loadRemoteCollection(entity));
  }, [userId]);

  // Pick up role / status changes made by an Admin or CEO since this session started.
  useEffect(() => {
    if (!userId) return undefined;
    let active = true;
    api.get('/auth/me').then((user) => {
      const current = getSession();
      if (!active || !user || current?.user?.id !== user.id) return;
      if (JSON.stringify(current.user) !== JSON.stringify(user)) {
        applyProfile(user);
        setSession({ ...current, user });
      }
    }).catch(() => { /* offline or session ending: keep what we have */ });
    return () => { active = false; };
  }, [userId]);

  /**
   * Step 1 of sign-in. Resolves to { user } when signed in, or to
   * { otpRequired, challenge, email, expiresIn, codeLength } when a code was emailed
   * (finish with verifyOtp).
   */
  const login = useCallback(async (email, password, remember = true) => {
    const next = await api.post('/auth/login', { email, password }, { auth: false });
    if (next?.otpRequired) return next;
    onSignedIn(next);
    setSession(next, remember);
    return { user: next.user };
  }, []);

  /** Step 2: the emailed code. */
  const verifyOtp = useCallback(async (challenge, code, remember = true) => {
    const next = await api.post('/auth/verify-otp', { challenge, code }, { auth: false });
    onSignedIn(next);
    setSession(next, remember);
    return next.user;
  }, []);

  /** Emails a new code; resolves to a renewed challenge. */
  const resendOtp = useCallback((challenge) => api.post('/auth/resend-otp', { challenge }, { auth: false }), []);

  /** Merges changes into the signed-in user (e.g. a new photo or name) everywhere at once. */
  const updateUser = useCallback((changes) => {
    const current = getSession();
    if (!current?.user) return;
    const user = { ...current.user, ...changes };
    applyProfile(user);
    setSession({ ...current, user });
  }, []);

  /** Resolves to { requiresEmailConfirmation, user }. Signs in immediately when no confirmation is needed. */
  const register = useCallback(async ({ fullName, company, role, email, password }) => {
    const result = await api.post('/auth/register', { fullName, company, role, email, password }, { auth: false });
    if (result?.session) {
      onSignedIn(result.session);
      setSession(result.session, true);
    }
    return result;
  }, []);

  const logout = useCallback(async () => {
    try {
      if (getSession()) await api.post('/auth/logout');
    } catch {
      // The local session is cleared regardless of whether the server call succeeds.
    }
    clearRemoteCaches(REMOTE_ENTITIES);
    clearSession('signed-out');
  }, []);

  const forgotPassword = useCallback((email) => api.post('/auth/forgot-password', { email }, { auth: false }), []);
  const resendConfirmation = useCallback((email) => api.post('/auth/resend-confirmation', { email }, { auth: false }), []);

  const role = session?.user?.accessRole ?? null;
  const can = useCallback((permission) => roleCan(role, permission), [role]);

  const value = useMemo(() => ({
    session,
    user: session?.user ?? null,
    role,
    can,
    isAuthenticated: !!session,
    login,
    verifyOtp,
    resendOtp,
    updateUser,
    register,
    logout,
    forgotPassword,
    resendConfirmation,
  }), [session, role, can, login, verifyOtp, resendOtp, updateUser, register, logout, forgotPassword, resendConfirmation]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}

/** Route guard: sends signed-out visitors to /login and brings them back afterwards. */
export function RequireAuth({ children }) {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  if (!isAuthenticated) {
    const next = `${location.pathname}${location.search}${location.hash}`;
    return <Navigate to={`/login?next=${encodeURIComponent(next)}`} replace />;
  }
  return children;
}

/** Only allow same-app paths as a post-login destination (no open redirects). */
export function safeNextPath(raw) {
  if (!raw || !raw.startsWith('/') || raw.startsWith('//') || raw.startsWith('/login') || raw.startsWith('/register')) return HOME_PATH;
  return raw;
}
