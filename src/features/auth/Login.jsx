import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail, ArrowRight, Zap, Loader2 } from 'lucide-react';
import { useToast } from '../../components/ui/Toast';
import AuthLayout, { AuthField } from './AuthLayout';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Login() {
  const [email, setEmail] = useState('admin@meridian.com');
  const [password, setPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();
  const addToast = useToast();

  const signIn = (message) => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      addToast(message, 'success');
      navigate('/dashboard');
    }, 700);
  };

  const handleLogin = (e) => {
    e.preventDefault();
    const next = {};
    if (!EMAIL_RE.test(email)) next.email = 'Enter a valid work email address';
    if (password.length < 6) next.password = 'Password must be at least 6 characters';
    setErrors(next);
    if (Object.keys(next).length) return;
    signIn('Welcome back!');
  };

  const handleQuickDemo = () => {
    setEmail('admin@meridian.com');
    setPassword('password123');
    setErrors({});
    signIn('Signed in to the demo workspace');
  };

  return (
    <AuthLayout
      eyebrow="Secure sign-in"
      title="Welcome back"
      subtitle="Sign in to your quality management workspace."
    >
      <div className="auth-form space-y-4">
        <button type="button" onClick={handleQuickDemo} disabled={loading} className="auth-alt auth-demo group !border-primary-200 !bg-primary-50 !text-primary-700">
          <Zap size={16} className="text-accent-500 transition-transform duration-300 group-hover:rotate-12 group-hover:scale-125" aria-hidden="true" />
          One-click demo sign-in
        </button>

        <div className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
          <span className="h-px flex-1 bg-gray-200" /> or use your email <span className="h-px flex-1 bg-gray-200" />
        </div>

        <form id="login-form" onSubmit={handleLogin} noValidate className="space-y-4">
          <AuthField
            id="login-email"
            label="Work email"
            icon={Mail}
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setErrors(p => ({ ...p, email: undefined })); }}
            placeholder="name@company.com"
            error={errors.email}
          />
          <AuthField
            id="login-password"
            label="Password"
            icon={Lock}
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setErrors(p => ({ ...p, password: undefined })); }}
            placeholder="Enter your password"
            error={errors.password}
            right={(
              <button type="button" onClick={() => addToast('Demo workspace: password reset emails are not sent.', 'info')} className="text-[12px] font-semibold text-primary hover:text-primary-700 transition-colors">
                Forgot password?
              </button>
            )}
            trailing={(
              <button type="button" onClick={() => setShowPassword(s => !s)} className="btn-icon w-8 h-8" aria-label={showPassword ? 'Hide password' : 'Show password'} aria-pressed={showPassword}>
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            )}
          />
          <label htmlFor="login-remember" className="flex items-center gap-2.5 cursor-pointer select-none w-max">
            <input id="login-remember" type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} className="w-4 h-4 accent-[#187f65]" />
            <span className="text-[12.5px] text-gray-600">Keep me signed in on this device</span>
          </label>
        </form>

        <button type="submit" form="login-form" disabled={loading} className="btn-primary w-full !py-3 !text-sm !rounded-xl">
          {loading ? <><Loader2 size={16} className="animate-spin" aria-hidden="true" /> Signing in…</> : <>Sign in <ArrowRight size={16} aria-hidden="true" className="transition-transform group-hover:translate-x-1" /></>}
        </button>

        <p className="text-[13px] text-center text-gray-500">
          New to Meridian?{' '}
          <Link to="/register" className="font-bold text-primary hover:text-primary-700 transition-colors">Create an account</Link>
        </p>
      </div>
    </AuthLayout>
  );
}
