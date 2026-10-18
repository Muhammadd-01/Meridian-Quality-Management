import React, { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { User, SlidersHorizontal, Bell, Database, Plug, ShieldAlert, Save } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import { useToast } from '../../components/ui/Toast';
import { useSettings } from '../../lib/settings';
import { ENTITY_LIST } from '../../data/entities';
import { getStorageItem } from '../../lib/storage';
import { getImportedTrafficRows } from '../../services/traffic/trafficProvider';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function Section({ id, icon: Icon, title, description, children }) {
  return (
    <section id={id} className="card scroll-mt-20" aria-labelledby={`${id}-title`}>
      <div className="card-header">
        <div className="flex items-center gap-2.5">
          <span className="grid place-items-center w-8 h-8 rounded-lg bg-primary/10 text-primary" aria-hidden="true"><Icon size={16} /></span>
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
        <span className="w-10 h-6 rounded-full bg-gray-200 peer-checked:bg-primary transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-primary peer-focus-visible:ring-offset-2" aria-hidden="true" />
        <span className="absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow-sm transition-transform peer-checked:translate-x-4" aria-hidden="true" />
      </span>
    </label>
  );
}

const INTEGRATIONS = [
  { name: 'Application backend / database', status: 'Not connected', detail: 'All records are stored in this browser’s localStorage and seeded with demo data. Nothing is shared between users or devices.' },
  { name: 'Authentication & roles', status: 'Not connected', detail: 'The sign-in screen is a demo flow. There is no server-side identity or permission check, so role-based restrictions cannot be enforced.' },
  { name: 'Website analytics', status: 'Not connected', detail: 'Traffic Overview uses a labelled demo adapter or data you import. Add a provider in src/services/traffic/trafficProvider.js.' },
  { name: 'Email delivery', status: 'Not configured', detail: 'Calls & Emails records communications; no email is actually sent.' },
  { name: 'Realtime messaging', status: 'Not configured', detail: 'No messaging backend exists, so in-app chat is not offered.' },
  { name: 'AI assistance', status: 'Not configured', detail: 'No model is connected; the app does not generate AI insights.' },
];

export default function Settings() {
  const addToast = useToast();
  const location = useLocation();
  const [settings, setSettings] = useSettings();
  const [profile, setProfile] = useState(settings.profile);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!location.hash) return;
    const el = document.getElementById(location.hash.slice(1));
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [location.hash]);

  const storage = useMemo(() => {
    const rows = ENTITY_LIST.map(e => {
      const raw = (() => { try { return localStorage.getItem(e.key); } catch { return null; } })();
      const records = getStorageItem(e.key, null);
      return {
        label: e.label,
        count: Array.isArray(records) ? records.length : e.seed.length,
        bytes: raw ? raw.length * 2 : 0,
        seeded: raw === null,
      };
    });
    rows.push({ label: 'Imported traffic rows', count: getImportedTrafficRows().length, bytes: (localStorage.getItem('meridian-traffic-rows') || '').length * 2, seeded: false });
    return rows;
  }, []);

  const saveProfile = (e) => {
    e.preventDefault();
    const next = {};
    if (!profile.name.trim()) next.name = 'Name is required.';
    if (!EMAIL_RE.test(profile.email)) next.email = 'Enter a valid email address.';
    setErrors(next);
    if (Object.keys(next).length) return;
    setSaving(true);
    setSettings(prev => ({ ...prev, profile: { name: profile.name.trim(), title: profile.title.trim(), email: profile.email.trim() } }));
    setSaving(false);
    addToast('Profile saved to this browser.', 'success');
  };

  const setPref = (key, value) => setSettings(prev => ({ ...prev, preferences: { ...settings.preferences, ...(prev?.preferences || {}), [key]: value } }));
  const setNotif = (key, value) => setSettings(prev => ({ ...prev, notifications: { ...settings.notifications, ...(prev?.notifications || {}), [key]: value } }));

  return (
    <div>
      <PageHeader
        title="Settings & Preferences"
        subtitle="Profile details, display preferences, notifications and the status of integrations."
        breadcrumbs={[{ label: 'Workspace' }, { label: 'Settings' }]}
      />

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <Section id="profile" icon={User} title="Profile" description="Shown in the header and recorded as the actor in the audit log.">
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
              <label htmlFor="profile-email" className="form-label">Email *</label>
              <input id="profile-email" type="email" className="form-input" value={profile.email} onChange={(e) => setProfile(p => ({ ...p, email: e.target.value }))} aria-invalid={!!errors.email} aria-describedby={errors.email ? 'profile-email-err' : undefined} />
              {errors.email && <p id="profile-email-err" className="form-error">{errors.email}</p>}
            </div>
            <button type="submit" className="btn-primary" disabled={saving}><Save size={14} aria-hidden="true" /> Save profile</button>
          </form>
        </Section>

        <Section id="preferences" icon={SlidersHorizontal} title="Preferences" description="Saved instantly in this browser.">
          <div className="space-y-4">
            <div>
              <label htmlFor="pref-period" className="form-label">Default dashboard period</label>
              <select id="pref-period" className="form-select" value={settings.preferences.dashboardPeriod} onChange={(e) => setPref('dashboardPeriod', e.target.value)}>
                <option value="7">Last 7 days</option>
                <option value="30">Last 30 days</option>
                <option value="90">Last 90 days</option>
                <option value="365">Last 12 months</option>
              </select>
            </div>
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
            <Toggle checked={settings.notifications.deadlines} onChange={(v) => setNotif('deadlines', v)} label="Task deadlines" description="Overdue tasks and tasks due within 3 days." />
            <Toggle checked={settings.notifications.quotationExpiry} onChange={(v) => setNotif('quotationExpiry', v)} label="Quotation expiry" description="Sent quotations expiring within 7 days." />
          </div>
        </Section>

        <Section id="data" icon={Database} title="Data & storage" description="Record collections held in this browser.">
          <div className="table-container">
            <table className="data-table">
              <thead><tr><th>Collection</th><th className="text-right">Records</th><th className="text-right">Size</th><th>Source</th></tr></thead>
              <tbody>
                {storage.map(s => (
                  <tr key={s.label}>
                    <td>{s.label}</td>
                    <td className="text-right tabular-nums">{s.count}</td>
                    <td className="text-right tabular-nums text-xs">{s.bytes ? `${(s.bytes / 1024).toFixed(1)} KB` : '—'}</td>
                    <td className="text-xs text-gray-500">{s.seeded ? 'Demo seed (unchanged)' : 'Saved locally'}</td>
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

        <Section id="permissions" icon={ShieldAlert} title="Roles & permissions" description="Security model">
          <p className="text-sm text-gray-600">
            This build has no server, so it cannot enforce roles: hiding a button in the browser is not authorization. Every visitor of this
            browser profile can read and change every record. Role-aware navigation and protected operations should be added together with a
            backend that validates each request.
          </p>
        </Section>
      </div>
    </div>
  );
}
