import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { User, SlidersHorizontal, Bell, Database, Plug, ShieldCheck, Save, ArrowRight, KeyRound, MessageCircle, Mail } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import { useToast } from '../../components/ui/Toast';
import { useSettings } from '../../lib/settings';
import { ENTITY_LIST } from '../../data/entities';
import { getStorageItem } from '../../lib/storage';
import { getImportedTrafficRows } from '../../services/traffic/trafficProvider';
import { useAuth } from '../../lib/auth';
import { api } from '../../lib/api';
import ProfilePhoto from './ProfilePhoto';
import ChangePassword from './ChangePassword';
import WhatsAppLink from './WhatsAppLink';
import EmailConnect from './EmailConnect';
import { isPathVisible, visibleTarget } from '../../app/features';
import { PERMISSIONS, PERMISSION_LABELS, ROLE_DESCRIPTIONS, ROLE_BADGE } from '../../lib/permissions';

function Section({ id, icon: Icon, title, description, children }) {
  return (
    <section id={id} className="card scroll-mt-20" aria-labelledby={`${id}-title`}>
      <div className="card-header">
        <div className="flex items-center gap-2.5">
          <span className="grid place-items-center w-8 h-8 rounded-lg bg-primary-100 text-brand" aria-hidden="true"><Icon size={16} /></span>
          <div>
            <h2 id={`${id}-title`} className="text-sm font-semibold text-gray-800">{title}</h2>
            {description && <p className="text-xs text-gray-400 mt-0.5">{description}</p>}
          </div>
        </div>
      </div>
      <div className="card-body">{children}</div>
    </section>
  );
}

function Toggle({ checked, onChange, label, description }) {
  return (
    <label className="flex items-start justify-between gap-4 py-2.5 cursor-pointer">
      <span>
        <span className="block text-sm font-medium text-gray-800">{label}</span>
        {description && <span className="block text-xs text-gray-500 mt-0.5">{description}</span>}
      </span>
      <span className="relative inline-flex shrink-0">
        <input type="checkbox" role="switch" checked={checked} onChange={(e) => onChange(e.target.checked)} className="peer sr-only" />
        <span className="w-10 h-6 rounded-full bg-gray-200 peer-checked:bg-primary-400 transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-teal-500 peer-focus-visible:ring-offset-2" aria-hidden="true" />
        <span className="absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow-sm transition-transform peer-checked:translate-x-4" aria-hidden="true" />
      </span>
    </label>
  );
}

const INTEGRATIONS = [
  { name: 'Database (Supabase)', status: 'Connected', detail: 'Accounts, contacts, leads and deals are stored in Supabase through the Meridian API and shared by your whole team.' },
  { name: 'Sign-in & roles', status: 'Connected', detail: 'Supabase Auth with Admin, CEO, Manager and Employee roles, checked by the API and by database security rules.' },
  { name: 'Email delivery', status: 'Supabase Auth only', detail: 'Supabase sends sign-up confirmation and password-reset emails. The CRM itself does not send email.' },
];

export default function Settings() {
  const addToast = useToast();
  const location = useLocation();
  const [settings, setSettings] = useSettings();
  const { user, role, can, updateUser } = useAuth();
  const [profile, setProfile] = useState(() => ({ ...settings.profile, name: user?.fullName || settings.profile.name, title: user?.role ?? settings.profile.title, email: user?.email || settings.profile.email }));
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!location.hash) return;
    const el = document.getElementById(location.hash.slice(1));
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [location.hash]);

  const storage = useMemo(() => {
    const rows = ENTITY_LIST.filter(e => visibleTarget(e.path)).map(e => {
      const raw = (() => { try { return localStorage.getItem(e.key); } catch { return null; } })();
      const records = getStorageItem(e.key, null);
      return {
        label: e.label,
        count: Array.isArray(records) ? records.length : e.seed.length,
        bytes: raw ? raw.length * 2 : 0,
        source: e.remote ? 'Supabase (cached in this browser)' : raw === null ? 'Not used yet' : 'Saved in this browser',
      };
    });
    if (isPathVisible('/traffic-overview')) {
      rows.push({ label: 'Imported traffic rows', count: getImportedTrafficRows().length, bytes: (localStorage.getItem('meridian-traffic-rows') || '').length * 2, source: 'Saved in this browser' });
    }
    return rows;
  }, []);

  // Name and job title are saved to your account, so they follow you to every device.
  const saveProfile = async (e) => {
    e.preventDefault();
    const next = {};
    if (!profile.name.trim()) next.name = 'Name is required.';
    setErrors(next);
    if (Object.keys(next).length) return;
    setSaving(true);
    try {
      const saved = await api.patch('/users/me', { fullName: profile.name.trim(), jobTitle: profile.title.trim() });
      updateUser({ fullName: saved?.fullName || profile.name.trim(), role: saved?.jobTitle ?? profile.title.trim() });
      setSettings(prev => ({ ...prev, profile: { ...(prev?.profile || {}), name: profile.name.trim(), title: profile.title.trim() } }));
      addToast('Profile saved.', 'success');
    } catch (err) {
      addToast({ ...err, toastTitle: 'Profile not saved', message: err.message, status: err.status }, 'error');
    } finally {
      setSaving(false);
    }
  };

  const setPref = (key, value) => setSettings(prev => ({ ...prev, preferences: { ...settings.preferences, ...(prev?.preferences || {}), [key]: value } }));
  const setNotif = (key, value) => setSettings(prev => ({ ...prev, notifications: { ...settings.notifications, ...(prev?.notifications || {}), [key]: value } }));

  return (
    <div>
      <PageHeader
        title="Settings & Preferences"
        subtitle="Your profile, role, display preferences and notifications."
        breadcrumbs={[{ label: 'Workspace' }, { label: 'Settings' }]}
      />

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <Section id="profile" icon={User} title="Profile" description="Shown in the header and recorded as the actor in the audit log.">
          <div className="flex flex-wrap items-center gap-2 text-xs text-gray-600 mb-4 pb-4 border-b border-gray-100">
            <span>Signed in as <strong className="text-gray-800">{user?.email}</strong></span>
            {role && <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold ${ROLE_BADGE[role]}`}>{role}</span>}
          </div>
          <ProfilePhoto />
          <form onSubmit={saveProfile} className="space-y-4" noValidate>
            <div>
              <label htmlFor="profile-name" className="form-label">Display name *</label>
              <input id="profile-name" className="form-input" value={profile.name} onChange={(e) => setProfile(p => ({ ...p, name: e.target.value }))} aria-invalid={!!errors.name} aria-describedby={errors.name ? 'profile-name-err' : undefined} />
              {errors.name && <p id="profile-name-err" className="form-error">{errors.name}</p>}
            </div>
            <div>
              <label htmlFor="profile-title" className="form-label">Job title</label>
              <input id="profile-title" className="form-input" value={profile.title} onChange={(e) => setProfile(p => ({ ...p, title: e.target.value }))} />
            </div>
            <div>
              <label htmlFor="profile-email" className="form-label">Email</label>
              <input id="profile-email" type="email" className="form-input bg-gray-50 text-gray-500" value={profile.email} readOnly aria-describedby="profile-email-hint" />
              <p id="profile-email-hint" className="text-2xs text-gray-400 mt-1">This is your sign-in email. Ask an Admin to change it.</p>
            </div>
            <button type="submit" className="btn-primary" disabled={saving}><Save size={14} aria-hidden="true" /> {saving ? 'Saving…' : 'Save profile'}</button>
          </form>
        </Section>

        <Section id="password" icon={KeyRound} title="Change password" description="Confirmed with a code sent to your email.">
          <ChangePassword />
        </Section>

        <Section id="whatsapp" icon={MessageCircle} title="WhatsApp" description="Link your WhatsApp by QR to send records from the CRM.">
          <WhatsAppLink />
        </Section>

        <Section id="email" icon={Mail} title="Email" description="Connect your own email to send from the CRM.">
          <EmailConnect />
        </Section>

        <Section id="preferences" icon={SlidersHorizontal} title="Preferences" description="Saved instantly in this browser.">
          <div className="space-y-4">
            {isPathVisible('/dashboard') && <div>
              <label htmlFor="pref-period" className="form-label">Default dashboard period</label>
              <select id="pref-period" className="form-select" value={settings.preferences.dashboardPeriod} onChange={(e) => setPref('dashboardPeriod', e.target.value)}>
                <option value="7">Last 7 days</option>
                <option value="30">Last 30 days</option>
                <option value="90">Last 90 days</option>
                <option value="365">Last 12 months</option>
              </select>
            </div>}
            <Toggle
              checked={settings.preferences.reduceMotion}
              onChange={(v) => setPref('reduceMotion', v)}
              label="Reduce motion"
              description="Turns off page, card and chart animations. Your operating-system setting is always respected too."
            />
          </div>
        </Section>

        <Section id="notifications" icon={Bell} title="Notifications" description="Choose which events appear in the header bell.">
          <div className="divide-y divide-gray-100">
            <Toggle checked={settings.notifications.recordChanges} onChange={(v) => setNotif('recordChanges', v)} label="Record changes" description="Creates, updates, status changes, assignments and imports from the audit log." />
            {isPathVisible('/projects/tasks') && <Toggle checked={settings.notifications.deadlines} onChange={(v) => setNotif('deadlines', v)} label="Task deadlines" description="Overdue tasks and tasks due within 3 days." />}
            {isPathVisible('/sales-analytics/quotations') && <Toggle checked={settings.notifications.quotationExpiry} onChange={(v) => setNotif('quotationExpiry', v)} label="Quotation expiry" description="Sent quotations expiring within 7 days." />}
          </div>
        </Section>

        <Section id="data" icon={Database} title="Data & storage" description="Where each collection is kept."> 
          <div className="table-container">
            <table className="data-table">
              <thead><tr><th>Collection</th><th className="text-right">Records</th><th className="text-right">Size</th><th>Source</th></tr></thead>
              <tbody>
                {storage.map(s => (
                  <tr key={s.label}>
                    <td>{s.label}</td>
                    <td className="text-right tabular-nums">{s.count}</td>
                    <td className="text-right tabular-nums text-xs">{s.bytes ? `${(s.bytes / 1024).toFixed(1)} KB` : '—'}</td>
                    <td className="text-xs text-gray-500">{s.source}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        <Section id="integrations" icon={Plug} title="Integrations" description="What is and isn’t connected in this build.">
          <ul className="space-y-3">
            {INTEGRATIONS.map(i => (
              <li key={i.name} className="flex items-start justify-between gap-3">
                <div className="min-w-0 break-words">
                  <p className="text-sm font-medium text-gray-800">{i.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{i.detail}</p>
                </div>
                <span className="badge-secondary shrink-0">{i.status}</span>
              </li>
            ))}
          </ul>
        </Section>

        <Section id="permissions" icon={ShieldCheck} title="Your role & permissions" description="Checked by the server on every request.">
          <div className="space-y-3">
            <p className="text-sm text-gray-700">
              You are signed in as {role ? <strong>{role}</strong> : 'a user without an active role'}. {ROLE_DESCRIPTIONS[role] || ''}
            </p>
            <ul className="space-y-1.5">
              {Object.keys(PERMISSIONS).map(p => (
                <li key={p} className="flex items-center justify-between gap-3 text-xs">
                  <span className="text-gray-600">{PERMISSION_LABELS[p]}</span>
                  <span className={can(p) ? 'badge-success' : 'badge-secondary'}>{can(p) ? 'Allowed' : 'Not allowed'}</span>
                </li>
              ))}
            </ul>
            {can('users.view') && (
              <Link to="/users" className="inline-flex items-center gap-1 text-xs font-semibold text-brand hover:text-brand-strong group">
                Manage users &amp; roles <ArrowRight size={12} className="transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
              </Link>
            )}
          </div>
        </Section>
      </div>
    </div>
  );
}
