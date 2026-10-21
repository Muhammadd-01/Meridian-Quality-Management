import React from 'react';
import { Link } from 'react-router-dom';
import {
  Hexagon, Users, GanttChartSquare, TrendingUp, FileBarChart, CheckCircle2, ShieldCheck, Sparkles,
} from 'lucide-react';

const FEATURES = [
  { icon: Users, label: 'CRM', text: 'Companies, contacts, activities and calls' },
  { icon: TrendingUp, label: 'Sales', text: 'Leads, deals, quotations and pipeline' },
  { icon: GanttChartSquare, label: 'Projects', text: 'Milestones, tasks, team and timesheets' },
  { icon: FileBarChart, label: 'Reports', text: 'Reports, calendar and audit log' },
];

/** Sample workspace cards that float over the brand panel (illustrative UI preview). */
function PreviewCards() {
  return (
    <div className="relative h-[300px] mt-8" aria-hidden="true">
      {/* Project progress */}
      <div className="absolute left-0 top-2 w-[270px] rounded-2xl bg-white/[0.09] backdrop-blur-md border border-white/15 p-4 shadow-2xl animate-float" style={{ animationDuration: '7s' }}>
        <div className="flex items-center gap-2.5">
          <span className="grid place-items-center w-9 h-9 rounded-xl bg-gradient-to-br from-primary-300 to-primary-600"><GanttChartSquare size={16} /></span>
          <div className="min-w-0">
            <p className="text-[12.5px] font-bold truncate">ISO 9001 Implementation</p>
            <p className="text-[10.5px] text-white/55">12 of 18 tasks · due Nov 28</p>
          </div>
        </div>
        <div className="mt-3 h-1.5 rounded-full bg-white/10 overflow-hidden">
          <div className="h-full w-2/3 rounded-full bg-gradient-to-r from-primary-300 to-accent-300 auth-bar" />
        </div>
        <div className="mt-3 flex -space-x-2">
          {['SA', 'AK', 'FZ', 'OF'].map((i, n) => (
            <span key={i} className="w-6 h-6 rounded-full grid place-items-center text-[9px] font-bold ring-2 ring-[#16302a]" style={{ background: ['#24997c', '#c4901d', '#3e7ead', '#8b6fd6'][n] }}>{i}</span>
          ))}
        </div>
      </div>

      {/* Audit checklist */}
      <div className="absolute right-0 top-16 w-[230px] rounded-2xl bg-white/[0.09] backdrop-blur-md border border-white/15 p-4 shadow-2xl animate-float" style={{ animationDuration: '8s', animationDelay: '-2s' }}>
        <p className="text-[10.5px] font-bold uppercase tracking-wider text-white/55 mb-2.5">Audit checklist</p>
        {['Calibration records', 'Supplier evaluation', 'Internal audit plan'].map((item, i) => (
          <p key={item} className="flex items-center gap-2 text-[12px] py-1">
            <CheckCircle2 size={14} className={`auth-check ${i < 2 ? 'text-primary-300' : 'text-white/30'}`} style={{ animationDelay: `${0.6 + i * 0.35}s` }} />
            <span className={i < 2 ? 'text-white/90' : 'text-white/55'}>{item}</span>
          </p>
        ))}
      </div>

      {/* Mini chart */}
      <div className="absolute left-10 bottom-0 w-[250px] rounded-2xl bg-white/[0.09] backdrop-blur-md border border-white/15 p-4 shadow-2xl animate-float" style={{ animationDuration: '9s', animationDelay: '-4s' }}>
        <div className="flex items-center justify-between">
          <p className="text-[12px] font-bold">Pipeline by stage</p>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-accent-400/25 text-accent-200">Report</span>
        </div>
        <div className="mt-3 flex items-end gap-2 h-14">
          {[38, 62, 48, 80, 56, 92].map((h, i) => (
            <span key={i} className="flex-1 rounded-t-md bg-gradient-to-t from-primary-500/60 to-primary-300 auth-col" style={{ height: `${h}%`, animationDelay: `${0.4 + i * 0.08}s` }} />
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Split-screen frame for the sign-in and sign-up pages: animated spruce brand
 * panel on the left (desktop), the form card on the right.
 */
export default function AuthLayout({ children, eyebrow, title, subtitle }) {
  return (
    <div className="min-h-screen flex bg-surface-canvas relative overflow-hidden">
      {/* Brand panel */}
      <aside className="hidden lg:flex relative w-[52%] xl:w-[55%] flex-col justify-between p-12 xl:p-16 text-white hero-spruce hero-grid overflow-hidden rounded-r-[40px] shadow-2xl">
        <span className="hero-orb w-[520px] h-[520px] -top-48 -right-40 bg-[radial-gradient(circle,rgba(255,214,130,0.22),transparent_70%)] animate-float" style={{ animationDuration: '10s' }} aria-hidden="true" />
        <span className="hero-orb w-[460px] h-[460px] -bottom-56 -left-32 bg-[radial-gradient(circle,rgba(72,181,148,0.35),transparent_70%)] animate-float" style={{ animationDuration: '12s', animationDelay: '-3s' }} aria-hidden="true" />

        <Link to="/dashboard" className="relative inline-flex items-center gap-3 group w-max">
          <span className="grid place-items-center w-11 h-11 rounded-2xl bg-gradient-to-br from-primary-300 to-primary-700 shadow-glow-primary transition-transform duration-500 group-hover:rotate-[-12deg] group-hover:scale-105">
            <Hexagon className="w-6 h-6 fill-white/20 stroke-white" />
          </span>
          <span>
            <span className="block text-xl font-extrabold tracking-tight leading-5">Meridian</span>
            <span className="block text-[10px] uppercase tracking-[0.16em] text-white/55 font-bold">Quality Management Professionals</span>
          </span>
        </Link>

        <div className="relative max-w-xl auth-stagger">
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/15 text-xs font-semibold backdrop-blur-sm">
            <Sparkles size={13} className="text-accent-300" /> One workspace for quality professionals
          </span>
          <h2 className="font-display text-[40px] xl:text-[46px] leading-[1.08] font-extrabold tracking-tight mt-5">
            Clients, projects and sales — <span className="bg-gradient-to-r from-primary-200 via-accent-200 to-accent-300 bg-clip-text text-transparent">all in one place.</span>
          </h2>
          <p className="text-[15px] text-white/65 mt-4 leading-relaxed">
            Track every engagement from first enquiry to certification: CRM, sales pipeline, project delivery and website analytics, with reports you can export in one click.
          </p>
          <PreviewCards />
        </div>

        <div className="relative grid grid-cols-2 xl:grid-cols-4 gap-3">
          {FEATURES.map(f => (
            <div key={f.label} className="group rounded-2xl bg-white/[0.06] border border-white/10 p-3 transition-all duration-300 hover:bg-white/[0.12] hover:-translate-y-1">
              <f.icon size={16} className="text-primary-200 transition-transform duration-300 group-hover:scale-110" />
              <p className="text-[12.5px] font-bold mt-2">{f.label}</p>
              <p className="text-[11px] text-white/55 leading-snug mt-0.5">{f.text}</p>
            </div>
          ))}
        </div>
      </aside>

      {/* Form side */}
      <main className="flex-1 relative flex flex-col min-h-screen">
        <span className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-primary-400/15 blur-3xl animate-float pointer-events-none" style={{ animationDuration: '11s' }} aria-hidden="true" />
        <span className="absolute -bottom-40 -left-20 w-96 h-96 rounded-full bg-accent-300/15 blur-3xl animate-float pointer-events-none" style={{ animationDuration: '13s', animationDelay: '-5s' }} aria-hidden="true" />

        <div className="relative flex-1 flex items-center justify-center p-5 sm:p-10">
          <div className="w-full max-w-[460px] auth-stagger">
            {/* Compact brand on small screens */}
            <Link to="/dashboard" className="lg:hidden inline-flex items-center gap-2.5 mb-6">
              <span className="grid place-items-center w-10 h-10 rounded-2xl bg-gradient-to-br from-primary-400 to-primary-700 text-white shadow-glow-primary"><Hexagon className="w-5 h-5 fill-white/20 stroke-white" /></span>
              <span className="text-lg font-extrabold tracking-tight text-gray-900">Meridian</span>
            </Link>

            <div className="card !rounded-[28px] p-6 sm:p-8 shadow-xl">
              {eyebrow && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary-50 text-primary-700 text-[11px] font-bold">
                  <ShieldCheck size={12} /> {eyebrow}
                </span>
              )}
              <h1 className="font-display text-[28px] leading-tight font-extrabold tracking-tight text-gray-900 mt-3">{title}</h1>
              {subtitle && <p className="text-sm text-gray-500 mt-1.5">{subtitle}</p>}
              <div className="mt-6">{children}</div>
            </div>
          </div>
        </div>

        <footer className="relative px-6 pb-6 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[11.5px] text-gray-400">
          <span>© 2026 Meridian Quality Management Professionals</span>
          <span className="hidden sm:inline" aria-hidden="true">·</span>
          <span className="inline-flex items-center gap-1.5"><FileBarChart size={12} /> Demo workspace — data stays in this browser</span>
        </footer>
      </main>
    </div>
  );
}

/** Text input with a leading icon, used by the auth forms. */
export function AuthField({ id, label, icon: Icon, error, hint, trailing, right, ...props }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label htmlFor={id} className="text-[12.5px] font-semibold text-gray-800">{label}</label>
        {right}
      </div>
      <div className="relative group">
        {Icon && <Icon size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none transition-colors group-focus-within:text-primary" aria-hidden="true" />}
        <input
          id={id}
          className={`form-input !py-2.5 ${Icon ? 'pl-10' : ''} ${trailing ? 'pr-11' : ''} ${error ? '!border-danger-400' : ''}`}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
          {...props}
        />
        {trailing && <div className="absolute right-2 top-1/2 -translate-y-1/2">{trailing}</div>}
      </div>
      {error ? <p id={`${id}-error`} className="form-error">{error}</p> : hint ? <p id={`${id}-hint`} className="text-[11px] text-gray-400 mt-1">{hint}</p> : null}
    </div>
  );
}
