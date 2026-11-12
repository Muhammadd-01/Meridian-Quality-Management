import React, { useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail, ArrowRight, Loader2 } from 'lucide-react';
import { useToast } from '../../components/ui/Toast';
import AuthLayout, { AuthField } from './AuthLayout';
import OtpStep from './OtpStep';
import { useDocumentMeta } from '../../lib/seo';
import { useAuth, safeNextPath } from '../../lib/auth';
import { PUBLIC_SIGNUP } from '../../app/features';
import { friendlyMessage } from '../../lib/errors';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Login() {
  useDocumentMeta('/login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [unconfirmed, setUnconfirmed] = useState(false);
  const [otp, setOtp] = useState(null); // set when an emailed code is required
  const navigate = useNavigate();
  const addToast = useToast();
  const { isAuthenticated, login, forgotPassword, resendConfirmation } = useAuth();
  const [searchParams] = useSearchParams();
  const nextPath = safeNextPath(searchParams.get('next'));

  const signIn = async (signInEmail, signInPassword, message) => {
    setLoading(true);
    setUnconfirmed(false);
    try {
      const result = await login(signInEmail.trim(), signInPassword, rememberMe);
      if (result.otpRequired) {
        setOtp(result);
        setPassword('');
        setLoading(false);
        return;
      }
      welcome(result.user, message);
    } catch (err) {
      setLoading(false);
      if (err.code === 'email_not_confirmed') setUnconfirmed(true);
      setErrors({ form: friendlyMessage(err, 'Sign-in failed. Please try again.') });
    }
  };

  const welcome = (user, message = 'Welcome back, {name}!') => {
    addToast(message.replace('{name}', (user?.fullName || '').split(' ')[0] || 'there'), 'success');
    navigate(nextPath, { replace: true });
  };

  const handleForgotPassword = async () => {
    if (!EMAIL_RE.test(email)) {
      setErrors(p => ({ ...p, email: 'Enter your email above, then choose “Forgot password?”' }));
      return;
    }
    try {
      await forgotPassword(email.trim());
      addToast('If an account exists for that email, a password reset link is on its way.', 'info', 5000);
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  const handleResend = async () => {
    try {
      await resendConfirmation(email.trim());
      addToast('Confirmation email sent. Check your inbox.', 'info', 5000);
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  const handleLogin = (e) => {
    e.preventDefault();
    const next = {};
    if (!EMAIL_RE.test(email)) next.email = 'Enter a valid work email address';
    if (password.length < 6) next.password = 'Password must be at least 6 characters';
    setErrors(next);
    if (Object.keys(next).length) return;
    signIn(email, password, 'Welcome back, {name}!');
  };

  if (isAuthenticated && !loading) return <Navigate to={nextPath} replace />;

  if (otp) {
    return (
      <AuthLayout eyebrow="Two-step verification" title="Check your email" subtitle="One more step to keep your account safe.">
        <OtpStep
          otp={otp}
          remember={rememberMe}
          onVerified={(user) => welcome(user)}
          onBack={() => { setOtp(null); setErrors({}); }}
        />
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      eyebrow="Secure sign-in"
      title="Welcome back"
      subtitle="Sign in to your quality management workspace."
    >
      <div className="auth-form space-y-4 animate-fade-in">
        <form id="login-form" onSubmit={handleLogin} noValidate className="space-y-4">
          <AuthField
            id="login-email"
            label="Work email"
            icon={Mail}
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setErrors(p => ({ ...p, email: undefined, form: undefined })); }}
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
            onChange={(e) => { setPassword(e.target.value); setErrors(p => ({ ...p, password: undefined, form: undefined })); }}
            placeholder="Enter your password"
            error={errors.password}
            right={(
              <button type="button" onClick={handleForgotPassword} className="text-[12px] font-semibold text-brand hover:text-brand-strong transition-colors">
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
            <input id="login-remember" type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} className="w-4 h-4" />
            <span className="text-[12.5px] text-gray-600">Keep me signed in on this device</span>
          </label>
        </form>

        {errors.form && (
          <div role="alert" className="form-error !mt-0">
            {errors.form}
            {unconfirmed && (
              <button type="button" onClick={handleResend} className="ms-1 font-semibold underline">Resend confirmation email</button>
            )}
          </div>
        )}

        <button type="submit" form="login-form" disabled={loading} className="btn-primary w-full !py-3 !text-sm !rounded-xl">
          {loading ? <><Loader2 size={16} className="animate-spin" aria-hidden="true" /> Signing in…</> : <>Sign in <ArrowRight size={16} aria-hidden="true" className="transition-transform group-hover:translate-x-1" /></>}
        </button>

        <p className="text-[13px] text-center text-gray-500">
          {PUBLIC_SIGNUP ? (
            <>New to Meridian?{' '}<Link to="/register" className="font-bold text-brand hover:text-brand-strong transition-colors">Create an account</Link></>
          ) : 'Need an account? Ask your Admin or CEO to add you.'}
        </p>
      </div>
    </AuthLayout>
  );
}
