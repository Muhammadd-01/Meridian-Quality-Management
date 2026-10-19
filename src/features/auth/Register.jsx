import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail, User, Building2, ArrowRight, Check, Loader2, Briefcase } from 'lucide-react';
import { useToast } from '../../components/ui/Toast';
import AuthLayout, { AuthField } from './AuthLayout';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ROLES = ['Quality Manager', 'Lead Auditor', 'Operations Director', 'Compliance Officer', 'QA Engineer'];

const RULES = [
  { id: 'len', label: '8+ characters', test: (p) => p.length >= 8 },
  { id: 'case', label: 'Upper & lower case', test: (p) => /[a-z]/.test(p) && /[A-Z]/.test(p) },
  { id: 'num', label: 'A number', test: (p) => /\d/.test(p) },
  { id: 'sym', label: 'A symbol', test: (p) => /[^A-Za-z0-9]/.test(p) },
];
const STRENGTH = [
  { label: 'Too weak', color: 'bg-danger-500', text: 'text-danger-600' },
  { label: 'Weak', color: 'bg-danger-400', text: 'text-danger-600' },
  { label: 'Fair', color: 'bg-warning-500', text: 'text-warning-700' },
  { label: 'Good', color: 'bg-primary-400', text: 'text-primary-700' },
  { label: 'Strong', color: 'bg-success-500', text: 'text-success-700' },
];

export default function Register() {
  const [form, setForm] = useState({ fullName: '', company: '', email: '', role: ROLES[0], password: '', confirmPassword: '', agreeTerms: true });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const addToast = useToast();

  const set = (key) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm(prev => ({ ...prev, [key]: value }));
    setErrors(prev => ({ ...prev, [key]: undefined }));
  };

  const passed = RULES.filter(r => r.test(form.password)).length;
  const strength = STRENGTH[form.password ? passed : 0];
  const matches = form.confirmPassword && form.confirmPassword === form.password;

  const handleSubmit = (e) => {
    e.preventDefault();
    const next = {};
    if (!form.fullName.trim()) next.fullName = 'Enter your full name';
    if (!form.company.trim()) next.company = 'Enter your company';
    if (!EMAIL_RE.test(form.email)) next.email = 'Enter a valid work email address';
    if (passed < 3) next.password = 'Use at least 3 of the password rules below';
    if (form.password !== form.confirmPassword) next.confirmPassword = 'Passwords do not match';
    if (!form.agreeTerms) next.agreeTerms = 'Please accept the terms to continue';
    setErrors(next);
    if (Object.keys(next).length) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      addToast(`Welcome to Meridian, ${form.fullName.split(' ')[0]}!`, 'success');
      navigate('/dashboard');
    }, 800);
  };

  const eye = (
    <button type="button" onClick={() => setShowPassword(s => !s)} className="btn-icon w-8 h-8" aria-label={showPassword ? 'Hide passwords' : 'Show passwords'} aria-pressed={showPassword}>
      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
    </button>
  );

  return (
    <AuthLayout
      eyebrow="14-day full-access workspace"
      title="Create your account"
      subtitle="Set up your workspace in under a minute."
    >
      <form id="register-form" onSubmit={handleSubmit} noValidate className="auth-form space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <AuthField id="register-name" label="Full name" icon={User} autoComplete="name" value={form.fullName} onChange={set('fullName')} placeholder="e.g. Ayesha Malik" error={errors.fullName} />
          <AuthField id="register-company" label="Company" icon={Building2} autoComplete="organization" value={form.company} onChange={set('company')} placeholder="Company name" error={errors.company} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <AuthField id="register-email" label="Work email" icon={Mail} type="email" autoComplete="email" value={form.email} onChange={set('email')} placeholder="name@company.com" error={errors.email} />
          <div>
            <label htmlFor="register-role" className="block text-[12.5px] font-semibold text-gray-800 mb-1.5">Primary role</label>
            <div className="relative group">
              <Briefcase size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none transition-colors group-focus-within:text-primary" aria-hidden="true" />
              <select id="register-role" value={form.role} onChange={set('role')} className="form-select !py-2.5 pl-10">
                {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div>
          <AuthField
            id="register-password" label="Password" icon={Lock} type={showPassword ? 'text' : 'password'} autoComplete="new-password"
            value={form.password} onChange={set('password')} placeholder="Create a password" error={errors.password} trailing={eye}
          />
          {/* Strength meter */}
          <div className="mt-2.5" aria-live="polite">
            <div className="grid grid-cols-4 gap-1.5">
              {[0, 1, 2, 3].map(i => (
                <span key={i} className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                  <span className={`block h-full rounded-full transition-all duration-500 ease-spring ${i < passed ? strength.color : ''}`} style={{ width: i < passed ? '100%' : '0%' }} />
                </span>
              ))}
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 mt-2">
              <div className="flex flex-wrap gap-x-3 gap-y-1">
                {RULES.map(r => {
                  const ok = r.test(form.password);
                  return (
                    <span key={r.id} className={`inline-flex items-center gap-1 text-[11px] transition-colors ${ok ? 'text-primary-700 font-semibold' : 'text-gray-400'}`}>
                      <span className={`grid place-items-center w-3.5 h-3.5 rounded-full transition-all duration-300 ${ok ? 'bg-primary text-white scale-100' : 'bg-gray-200 scale-90'}`}><Check size={9} strokeWidth={3} aria-hidden="true" /></span>
                      {r.label}
                    </span>
                  );
                })}
              </div>
              {form.password && <span className={`text-[11px] font-bold ${strength.text}`}>{strength.label}</span>}
            </div>
          </div>
        </div>

        <AuthField
          id="register-confirm" label="Confirm password" icon={Lock} type={showPassword ? 'text' : 'password'} autoComplete="new-password"
          value={form.confirmPassword} onChange={set('confirmPassword')} placeholder="Repeat your password" error={errors.confirmPassword}
          trailing={matches ? <span className="grid place-items-center w-7 h-7 rounded-full bg-success-50 text-success-600 animate-scale-in" aria-label="Passwords match"><Check size={14} strokeWidth={3} /></span> : null}
        />

        <div>
          <label htmlFor="register-terms" className="flex items-start gap-2.5 cursor-pointer select-none">
            <input id="register-terms" type="checkbox" checked={form.agreeTerms} onChange={set('agreeTerms')} className="w-4 h-4 mt-0.5 accent-[#187f65]" aria-describedby={errors.agreeTerms ? 'register-terms-error' : undefined} />
            <span className="text-[12.5px] text-gray-600">I agree to the <span className="font-semibold text-primary">Terms of Service</span> and <span className="font-semibold text-primary">Privacy Policy</span>.</span>
          </label>
          {errors.agreeTerms && <p id="register-terms-error" className="form-error">{errors.agreeTerms}</p>}
        </div>

        <button type="submit" form="register-form" disabled={loading} className="btn-primary w-full !py-3 !text-sm !rounded-xl">
          {loading ? <><Loader2 size={16} className="animate-spin" aria-hidden="true" /> Creating your workspace…</> : <>Create account <ArrowRight size={16} aria-hidden="true" /></>}
        </button>

        <p className="text-[13px] text-center text-gray-500">
          Already have an account?{' '}
          <Link to="/login" className="font-bold text-primary hover:text-primary-700 transition-colors">Sign in</Link>
        </p>
      </form>
    </AuthLayout>
  );
}
