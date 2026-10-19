/**
 * Internal building blocks shared by the hospitality pages: a record form
 * dialog driven by the entity field definitions, segmented tabs, timers and
 * small display helpers. Theme tokens only, so light and dark mode both work.
 */
import React, { useEffect, useState } from 'react';
import Modal from '../../components/ui/Modal';
import { ENTITIES } from '../../data/entities';
import { generateId } from '../../utils/format';

export const initials = (name = '') => String(name).split(/\s+/).filter(Boolean).map(w => w[0]).slice(0, 2).join('').toUpperCase() || '?';
export const pkr = (n) => `PKR ${Math.round(Number(n) || 0).toLocaleString('en-US')}`;
export const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0);
export const sum = (rows, key) => rows.reduce((s, r) => s + (Number(typeof key === 'function' ? key(r) : r[key]) || 0), 0);
export const newId = (prefix) => `${prefix}-${generateId()}`;

const pad = (n) => String(n).padStart(2, '0');
export const todayIso = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};
export const addDaysIso = (iso, n) => {
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(y, m - 1, d + n);
  return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`;
};
export const daysBetween = (a, b) => {
  const [y1, m1, d1] = a.split('-').map(Number);
  const [y2, m2, d2] = b.split('-').map(Number);
  return Math.round((new Date(y2, m2 - 1, d2) - new Date(y1, m1 - 1, d1)) / 86400000);
};
export const shortDay = (iso) => {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short' });
};

/** Re-renders every `ms` so timers stay current. */
export function useNow(ms = 1000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), ms);
    return () => clearInterval(t);
  }, [ms]);
  return now;
}

/** "mm:ss" (or "h:mm:ss") since an ISO timestamp. */
export function elapsed(iso, now = Date.now()) {
  if (!iso) return '—';
  const s = Math.max(0, Math.floor((now - new Date(iso).getTime()) / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return h ? `${h}:${pad(m)}:${pad(sec)}` : `${m}:${pad(sec)}`;
}
export const minutesSince = (iso, now = Date.now()) => (iso ? Math.max(0, Math.floor((now - new Date(iso).getTime()) / 60000)) : 0);
export const clockTime = (iso) => (iso ? new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : '—');

/** Tone for a status word across all hospitality collections. */
const STATUS_TONES = {
  available: 'success', free: 'success', active: 'success', present: 'success', paid: 'success', delivered: 'success', done: 'success', fixed: 'success', published: 'success', clean: 'success', inspected: 'success', online: 'success', 'checked in': 'primary', served: 'primary',
  occupied: 'primary', confirmed: 'info', preparing: 'warning', 'in progress': 'info', 'on delivery': 'info', 'on the way': 'info', 'picked up': 'info', 'results entered': 'info', inspection: 'accent', ready: 'success',
  reserved: 'accent', new: 'primary', placed: 'gray', scheduled: 'gray', 'to do': 'gray', pending: 'warning', partial: 'warning', late: 'warning', surge: 'warning', cleaning: 'warning', dirty: 'warning', warning: 'warning', medium: 'warning', onboarding: 'info',
  maintenance: 'danger', absent: 'danger', overdue: 'danger', cancelled: 'danger', critical: 'danger', urgent: 'danger', high: 'danger', lost: 'danger', toxic: 'danger', 'sold out': 'danger', paused: 'gray', offline: 'gray', 'checked out': 'gray', ignored: 'gray', notice: 'info', low: 'gray', leave: 'info', 'on leave': 'info', withdrawn: 'gray',
  regular: 'gray', silver: 'info', gold: 'accent', platinum: 'primary',
};
export const toneOf = (status) => STATUS_TONES[String(status || '').toLowerCase()] || 'gray';
const BADGE = { primary: 'badge-primary', success: 'badge-success', warning: 'badge-warning', danger: 'badge-danger', info: 'badge-info', accent: 'badge-accent', gray: 'badge-secondary' };
export function Pill({ status, tone, className = '', children }) {
  return <span className={`${BADGE[tone || toneOf(status)]} ${className}`}>{children ?? status}</span>;
}
/** Solid status swatch classes for map tiles and legends. */
export const SWATCH = {
  primary: 'bg-primary-500', success: 'bg-success-500', warning: 'bg-warning-500', danger: 'bg-danger-500',
  info: 'bg-info-500', accent: 'bg-accent-500', gray: 'bg-gray-400',
};
/** Soft tile classes (border + background) by tone. */
export const SOFT = {
  primary: 'border-primary-200 bg-primary-50', success: 'border-success-200 bg-success-50', warning: 'border-warning-200 bg-warning-50',
  danger: 'border-danger-200 bg-danger-50', info: 'border-info-200 bg-info-50', accent: 'border-accent-200 bg-accent-50', gray: 'border-gray-200 bg-gray-50',
};

export function DemoBadge({ show = true }) {
  if (!show) return null;
  return <span className="badge-warning text-2xs" title="Seeded demo record">Demo</span>;
}

export function Avatar({ name, size = 'w-8 h-8', className = '' }) {
  return <span className={`${size} rounded-full bg-primary-50 text-primary-700 grid place-items-center text-xs font-bold shrink-0 ${className}`} aria-hidden="true">{initials(name)}</span>;
}

/** Pill-style segmented control (role=tablist). */
export function Segmented({ value, onChange, options, label }) {
  return (
    <div className="flex flex-wrap items-center gap-1" role="tablist" aria-label={label}>
      {options.map(o => {
        const v = typeof o === 'string' ? o : o.value;
        const l = typeof o === 'string' ? o : o.label;
        return (
          <button key={v} type="button" role="tab" aria-selected={value === v} onClick={() => onChange(v)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${value === v ? 'bg-primary text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
            {l}{o.count !== undefined && <span className="opacity-70"> ({o.count})</span>}
          </button>
        );
      })}
    </div>
  );
}

export function Labelled({ id, label, children, className = '' }) {
  return (
    <div className={className}>
      <label htmlFor={id} className="form-label">{label}</label>
      {children}
    </div>
  );
}

const toFormValue = (field, v) => {
  if (v === undefined || v === null) return '';
  if (field.type === 'list') return Array.isArray(v) ? v.join(', ') : String(v);
  return String(v);
};
const coerce = (field, raw) => {
  const v = typeof raw === 'string' ? raw.trim() : raw;
  if (v === '' || v === undefined) return undefined;
  if (field.type === 'number') return Number(v);
  if (field.type === 'list') return String(v).split(',').map(s => s.trim()).filter(Boolean);
  return v;
};

/**
 * Add / edit dialog generated from an entity's field list.
 *   <EntityForm entityType open record onClose onSubmit(data, record) fields? title? extra? validate? />
 * `fields` may override options per key: [{ key, options }]. `initial` pre-fills a new record.
 */
export function EntityForm({ entityType, open, record, initial, onClose, onSubmit, fieldKeys, overrides = {}, title, validate, records = [] }) {
  const entity = ENTITIES[entityType];
  const fields = entity.fields
    .filter(f => !f.accessor && f.form !== false && (!fieldKeys || fieldKeys.includes(f.key)))
    .map(f => ({ ...f, ...(overrides[f.key] || {}) }));
  const [form, setForm] = useState({});
  const [errors, setErrors] = useState({});
  const formId = `${entityType}-hosp-form`;

  useEffect(() => {
    if (!open) return;
    const src = record || initial || {};
    setForm(Object.fromEntries(fields.map(f => [f.key, record || src[f.key] !== undefined ? toFormValue(f, src[f.key]) : (f.type === 'enum' && f.required ? f.options?.[0] ?? '' : '')])));
    setErrors({});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, record?.id]);

  const submit = (e) => {
    e.preventDefault();
    const data = {};
    const errs = {};
    fields.forEach(f => {
      const value = coerce(f, form[f.key]);
      if (f.required && (value === undefined || value === '')) errs[f.key] = `${f.label} is required`;
      else if (f.type === 'number' && value !== undefined && Number.isNaN(value)) errs[f.key] = `${f.label} must be a number`;
      else if (f.type === 'number' && value !== undefined && f.min !== undefined && value < f.min) errs[f.key] = `${f.label} must be at least ${f.min}`;
      else if (f.type === 'number' && value !== undefined && f.max !== undefined && value > f.max) errs[f.key] = `${f.label} must be at most ${f.max}`;
      else if (f.type === 'email' && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) errs[f.key] = 'Enter a valid email address';
      data[f.key] = value;
    });
    if (!Object.keys(errs).length) {
      const dupe = (entity.dedupeKeys || []).map(keys => {
        const sig = keys.map(k => String(({ ...record, ...data })[k] ?? '').trim().toLowerCase()).join('|');
        return sig.replace(/\|/g, '') && records.find(r => r.id !== record?.id && keys.map(k => String(r[k] ?? '').trim().toLowerCase()).join('|') === sig);
      }).find(Boolean);
      if (dupe) errs.__form = `A ${entity.singular.toLowerCase()} matching "${entity.title(dupe)}" already exists.`;
    }
    if (!Object.keys(errs).length && validate) {
      const v = validate(data, record);
      if (v) Object.assign(errs, typeof v === 'string' ? { __form: v } : v);
    }
    setErrors(errs);
    if (Object.keys(errs).length) return;
    Object.keys(data).forEach(k => data[k] === undefined && delete data[k]);
    onSubmit(data, record);
  };

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title={title || (record ? `Edit ${entity.singular.toLowerCase()}` : `Add ${entity.singular.toLowerCase()}`)}
      size="lg"
      footer={(
        <>
          <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" form={formId} className="btn-primary">{record ? 'Save changes' : `Save ${entity.singular.toLowerCase()}`}</button>
        </>
      )}
    >
      <form id={formId} onSubmit={submit} noValidate className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3.5">
        {errors.__form && <p role="alert" className="sm:col-span-2 text-xs text-danger-700 bg-danger-50 border border-danger-100 rounded-lg px-3 py-2">{errors.__form}</p>}
        {fields.map(f => {
          const id = `${formId}-${f.key}`;
          const err = errors[f.key];
          const common = {
            id, value: form[f.key] ?? '', 'aria-invalid': !!err, 'aria-describedby': err ? `${id}-error` : undefined,
            onChange: (e) => { setForm(prev => ({ ...prev, [f.key]: e.target.value })); setErrors(prev => ({ ...prev, [f.key]: undefined, __form: undefined })); },
          };
          return (
            <div key={f.key} className={f.type === 'textarea' || f.wide ? 'sm:col-span-2' : ''}>
              <label htmlFor={id} className="form-label">{f.label}{f.required && <span className="text-danger"> *</span>}</label>
              {f.type === 'enum' ? (
                <select {...common} className="form-select">
                  {!f.required && <option value="">—</option>}
                  {(f.options || []).map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              ) : f.type === 'textarea' ? (
                <textarea {...common} rows={3} className="form-input" placeholder={f.placeholder} />
              ) : (
                <input {...common}
                  type={f.type === 'number' ? 'number' : f.type === 'date' ? 'date' : f.type === 'email' ? 'email' : 'text'}
                  min={f.min} max={f.max} step={f.step || (f.type === 'number' ? 'any' : undefined)}
                  className="form-input" placeholder={f.placeholder || (f.type === 'list' ? 'Comma separated' : undefined)} />
              )}
              {err && <p id={`${id}-error`} className="form-error">{err}</p>}
            </div>
          );
        })}
      </form>
    </Modal>
  );
}
