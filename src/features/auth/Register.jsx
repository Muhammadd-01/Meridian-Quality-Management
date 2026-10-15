import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Hexagon, Eye, EyeOff, Lock, Mail, User, Building2, ArrowRight, ShieldCheck, CheckCircle2, Star } from 'lucide-react';
import { useToast } from '../../components/ui/Toast';

export default function Register() {
  const [formData, setFormData] = useState({
    fullName: '',
    company: '',
    email: '',
    role: 'Quality Manager',
    password: '',
    confirmPassword: '',
    agreeTerms: true,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const addToast = useToast();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.fullName || !formData.company || !formData.email || !formData.password) {
      addToast('Please fill out all required fields', 'error');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      addToast('Passwords do not match', 'error');
      return;
    }
    if (!formData.agreeTerms) {
      addToast('Please agree to terms and privacy policy', 'error');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      addToast('Account created successfully! Welcome to Meridian.', 'success');
      navigate('/dashboard');
    }, 600);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Left Form Area */}
      <div className="flex-1 flex flex-col justify-between p-6 sm:p-12 lg:p-16 max-w-xl mx-auto w-full">
        <div>
          {/* Brand Logo */}
          <Link to="/dashboard" className="inline-flex items-center gap-2.5 mb-8 group">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white shadow-md shadow-primary/20 group-hover:scale-105 transition-transform">
              <Hexagon className="w-6 h-6 fill-white/20 stroke-white" />
            </div>
            <div>
              <span className="text-base font-bold text-gray-900 tracking-tight block">
                Meridian
              </span>
              <span className="text-[10px] text-gray-400 font-medium tracking-wide uppercase block -mt-1">
                Quality Management Professionals
              </span>
            </div>
          </Link>

          {/* Form Header */}
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
              Create an account
            </h1>
            <p className="text-sm text-gray-500 mt-1.5">
              Start your 14-day full access enterprise quality trial. No credit card required.
            </p>
          </div>

          {/* Register Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="form-label text-xs font-semibold text-gray-700">
                  Full Name
                </label>
                <div className="relative">
                  <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="e.g. Dr. Kamran"
                    className="form-input pl-10"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="form-label text-xs font-semibold text-gray-700">
                  Company / Organization
                </label>
                <div className="relative">
                  <Building2 size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  <input
                    type="text"
                    name="company"
                    value={formData.company}
                    onChange={handleChange}
                    placeholder="Company name"
                    className="form-input pl-10"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="form-label text-xs font-semibold text-gray-700">
                  Work Email
                </label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="name@company.com"
                    className="form-input pl-10"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="form-label text-xs font-semibold text-gray-700">
                  Primary Role
                </label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="form-select"
                >
                  <option value="Quality Manager">Quality Manager</option>
                  <option value="Lead Auditor">Lead Auditor</option>
                  <option value="Operations Director">Operations Director</option>
                  <option value="Compliance Officer">Compliance Officer</option>
                  <option value="QA Engineer">QA Engineer</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="form-label text-xs font-semibold text-gray-700">
                  Password
                </label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Min 8 characters"
                    className="form-input pl-10 pr-9"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="form-label text-xs font-semibold text-gray-700">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Repeat password"
                    className="form-input pl-10"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="pt-1">
              <label className="flex items-start gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  name="agreeTerms"
                  checked={formData.agreeTerms}
                  onChange={handleChange}
                  className="rounded border-gray-300 text-primary focus:ring-primary w-4 h-4 mt-0.5"
                />
                <span className="text-xs text-gray-600">
                  I agree to the <span className="text-primary hover:underline">Terms of Service</span> and acknowledge the <span className="text-primary hover:underline">Privacy Policy</span>.
                </span>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-2.5 mt-3 text-sm font-semibold flex items-center justify-center gap-2 shadow-md shadow-primary/25 disabled:opacity-60 cursor-pointer"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Creating Account...</span>
                </>
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* Login Link */}
          <p className="text-xs text-center text-gray-500 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-primary hover:underline">
              Sign In
            </Link>
          </p>
        </div>

        {/* Footer info */}
        <div className="pt-6 border-t border-gray-100 text-[11px] text-gray-400 text-center sm:text-left flex flex-col sm:flex-row justify-between items-center gap-2">
          <span>© 2026 Meridian Quality Management Professionals</span>
          <div className="flex gap-4">
            <span className="hover:text-gray-600 cursor-pointer">Security</span>
            <span className="hover:text-gray-600 cursor-pointer">Compliance</span>
            <span className="hover:text-gray-600 cursor-pointer">Contact</span>
          </div>
        </div>
      </div>

      {/* Right Hero Branding Area (Desktop only) */}
      <div className="hidden lg:flex flex-1 bg-[#141414] text-white p-12 lg:p-16 flex-col justify-between relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-accent/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top badge */}
        <div className="relative z-10">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-white text-xs font-semibold backdrop-blur-sm border border-white/10">
            <ShieldCheck size={14} className="text-primary" /> ISO 9001 / ISO 14001 / IATF 16949 Ready
          </span>
        </div>

        {/* Center content */}
        <div className="relative z-10 max-w-lg my-auto py-10">
          <h2 className="text-3xl lg:text-4xl font-extrabold leading-tight text-white tracking-tight">
            Join thousands of certified quality organizations worldwide.
          </h2>
          <p className="text-sm text-white/70 mt-4 leading-relaxed">
            Get instant access to enterprise project workflows, compliance audits, customer relationship tracking, and learning management dashboards.
          </p>

          <div className="space-y-3 mt-8">
            {[
              'Automated ISO audit checklists and NCR tracking',
              'Integrated CRM lead pipeline with revenue projections',
              'Interactive LMS course telemetry and assessment performance',
              'Export audit-ready PDF/CSV reports in one click',
            ].map((feat, i) => (
              <div key={i} className="flex items-center gap-2.5 text-xs text-white/90">
                <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                  <CheckCircle2 size={13} className="text-primary" />
                </div>
                <span>{feat}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom statistics */}
        <div className="relative z-10 grid grid-cols-3 gap-4 pt-6 border-t border-white/10">
          <div>
            <p className="text-lg font-bold text-white">100%</p>
            <p className="text-[10px] text-white/50 mt-0.5">Cloud-Sync</p>
          </div>
          <div>
            <p className="text-lg font-bold text-primary">24/7</p>
            <p className="text-[10px] text-white/50 mt-0.5">Support SLA</p>
          </div>
          <div>
            <p className="text-lg font-bold text-white">SOC-2</p>
            <p className="text-[10px] text-white/50 mt-0.5">Type II Compliant</p>
          </div>
        </div>
      </div>
    </div>
  );
}
