import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Hexagon, Eye, EyeOff, Lock, Mail, ArrowRight, ShieldCheck, CheckCircle2, Star } from 'lucide-react';
import { useToast } from '../../components/ui/Toast';

export default function Login() {
  const [email, setEmail] = useState('admin@meridian.com');
  const [password, setPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const addToast = useToast();

  const handleLogin = (e) => {
    e.preventDefault();
    if (!email || !password) {
      addToast('Please enter both email and password', 'error');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      addToast('Welcome back, Admin!', 'success');
      navigate('/dashboard');
    }, 600);
  };

  const handleQuickDemo = () => {
    setEmail('admin@meridian.com');
    setPassword('password123');
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      addToast('Signed in with Demo Credentials', 'success');
      navigate('/dashboard');
    }, 400);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Left Form Area */}
      <div className="flex-1 flex flex-col justify-between p-6 sm:p-12 lg:p-16 max-w-xl mx-auto w-full">
        <div>
          {/* Brand Logo */}
          <Link to="/dashboard" className="inline-flex items-center gap-2.5 mb-10 group">
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
          <div className="mb-8">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
              Welcome back
            </h1>
            <p className="text-sm text-gray-500 mt-2">
              Sign in to access your quality management workspace and analytics.
            </p>
          </div>

          {/* Quick Demo Button */}
          <button
            type="button"
            onClick={handleQuickDemo}
            className="w-full mb-6 py-2.5 px-4 rounded-xl border border-primary/30 bg-primary-50/50 hover:bg-primary-50 text-primary-700 text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <ShieldCheck size={16} className="text-primary" />
            <span>Click to One-Click Sign In (Demo Admin)</span>
          </button>

          <div className="relative flex items-center justify-center mb-6">
            <div className="border-t border-gray-200 w-full" />
            <span className="bg-gray-50 px-3 text-xs text-gray-400 uppercase tracking-wider shrink-0 font-medium">
              or sign in with email
            </span>
          </div>

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="form-label text-xs font-semibold text-gray-700">
                Work Email Address
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="form-input pl-10"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-gray-700">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => addToast('Reset link sent to demo email', 'info')}
                  className="text-xs font-medium text-primary hover:underline"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="form-input pl-10 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-gray-300 text-primary focus:ring-primary w-4 h-4"
                />
                <span className="text-xs text-gray-600">Remember this device for 30 days</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-2.5 mt-2 text-sm font-semibold flex items-center justify-center gap-2 shadow-md shadow-primary/25 disabled:opacity-60 cursor-pointer"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* Registration link */}
          <p className="text-xs text-center text-gray-500 mt-8">
            Don't have an account yet?{' '}
            <Link to="/register" className="font-semibold text-primary hover:underline">
              Create an account
            </Link>
          </p>
        </div>

        {/* Footer info */}
        <div className="pt-8 border-t border-gray-100 text-[11px] text-gray-400 text-center sm:text-left flex flex-col sm:flex-row justify-between items-center gap-2">
          <span>© 2026 Meridian Quality Management</span>
          <div className="flex gap-4">
            <span className="hover:text-gray-600 cursor-pointer">Privacy Policy</span>
            <span className="hover:text-gray-600 cursor-pointer">Terms of Service</span>
            <span className="hover:text-gray-600 cursor-pointer">Support</span>
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
            <ShieldCheck size={14} className="text-primary" /> Enterprise QMS & Intelligence Platform
          </span>
        </div>

        {/* Center content */}
        <div className="relative z-10 max-w-lg my-auto py-12">
          <h2 className="text-3xl lg:text-4xl font-extrabold leading-tight text-white tracking-tight">
            Everything you need to manage quality & compliance.
          </h2>
          <p className="text-sm text-white/70 mt-4 leading-relaxed">
            ISO standards compliance, project telemetry, CRM pipelines, and LMS certification metrics unified in one synchronized enterprise suite.
          </p>

          {/* Testimonial Card */}
          <div className="mt-8 p-6 rounded-2xl bg-white/[0.06] backdrop-blur-md border border-white/10">
            <div className="flex gap-1 text-amber-400 mb-3">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={14} className="fill-amber-400" />
              ))}
            </div>
            <p className="text-xs text-white/90 italic leading-relaxed">
              "Meridian transformed our ISO 9001 and ISO 14001 readiness. It reduced audit preparation time by 60% and gave our leadership instant transparency across every operational milestone."
            </p>
            <div className="flex items-center gap-3 mt-4 pt-4 border-t border-white/10">
              <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center font-bold text-xs text-primary">
                ML
              </div>
              <div>
                <p className="text-xs font-bold text-white">Marcus Lee</p>
                <p className="text-[10px] text-white/50">VP Quality Assurance · Northwind Engineering</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom statistics */}
        <div className="relative z-10 grid grid-cols-3 gap-4 pt-6 border-t border-white/10">
          <div>
            <p className="text-lg font-bold text-white">12,000+</p>
            <p className="text-[10px] text-white/50 mt-0.5">Professionals</p>
          </div>
          <div>
            <p className="text-lg font-bold text-primary">99.8%</p>
            <p className="text-[10px] text-white/50 mt-0.5">Audit Pass Rate</p>
          </div>
          <div>
            <p className="text-lg font-bold text-white">140+</p>
            <p className="text-[10px] text-white/50 mt-0.5">Countries</p>
          </div>
        </div>
      </div>
    </div>
  );
}
