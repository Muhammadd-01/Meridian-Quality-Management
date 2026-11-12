import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  UserCog, Plus, ShieldCheck, Users as UsersIcon, UserCheck, UserX, Check, Minus, RefreshCw, KeyRound, AlertTriangle,
  MessageCircle, Phone, Pencil, Copy, CheckCircle2, Trash2, Loader2, Send, RotateCw,
} from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import StatCard from '../../components/ui/StatCard';
import SearchInput from '../../components/ui/SearchInput';
import FilterDropdown from '../../components/ui/FilterDropdown';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import EmptyState from '../../components/ui/EmptyState';
import LoadingState from '../../components/ui/LoadingState';
import { useToast } from '../../components/ui/Toast';
import { api } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { ROLES, PERMISSIONS, PERMISSION_LABELS, ROLE_DESCRIPTIONS, ROLE_BADGE } from '../../lib/permissions';
import { formatDate } from '../../utils/format';
import Avatar from '../../components/ui/Avatar';
import { friendlyMessage } from '../../lib/errors';
import { checkPhone, formatPhone, isWhatsAppReady, whatsappLink, signInDetailsMessage, splitPhone } from '../../lib/phone';
import PhoneInput from '../../components/ui/PhoneInput';
import { isLinked, useWhatsAppStatus } from '../../lib/whatsapp';
import { Link } from 'react-router-dom';
import { countryByIso, DEFAULT_COUNTRY } from '../../data/countries';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const emptyForm = { fullName: '', email: '', jobTitle: '', phone: '', phoneCountry: DEFAULT_COUNTRY, role: 'Employee', password: '' };
const dialOf = (iso) => countryByIso(iso).dial;

// A readable temporary password that meets the API's rules (upper, lower, digit, symbol).
function generatePassword() {
  const pick = (set, n) => Array.from(crypto.getRandomValues(new Uint32Array(n)), v => set[v % set.length]).join('');
  const chars = [...pick('ABCDEFGHJKLMNPQRSTUVWXYZ', 3), ...pick('abcdefghijkmnpqrstuvwxyz', 5), ...pick('23456789', 3), ...pick('!@#$%*?', 1)];
  return chars.sort(() => crypto.getRandomValues(new Uint8Array(1))[0] - 128).join('');
}

function passwordProblem(pw) {
  if (pw.length < 8) return 'Password must be at least 8 characters.';
  const classes = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter(re => re.test(pw)).length;
  return classes < 3 ? 'Use at least three of: lower case, upper case, a number, a symbol.' : '';
}

/** Live check under a phone field: WhatsApp-ready, landline, or not a valid number. */
function PhoneHint({ value, country }) {
  const c = checkPhone(value, dialOf(country));
  if (c.status === 'empty') return <p className="text-2xs text-gray-400 mt-1">Optional. Pick the country, then type the number (a leading 0 is fine).</p>;
  if (c.status === 'invalid') return <p className="text-2xs text-danger-600 mt-1">{c.message}</p>;
  if (c.status === 'landline') return <p className="text-2xs text-warning-700 mt-1">{c.display} · {c.message}</p>;
  return (
    <p className="text-2xs text-success-700 mt-1 inline-flex items-center gap-1">
      <CheckCircle2 size={12} aria-hidden="true" /> {c.display} · WhatsApp-ready
    </p>
  );
}

function RoleBadge({ role }) {
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold ${ROLE_BADGE[role] || ROLE_BADGE.Employee}`}>{role}</span>;
}

export default function Users() {
  const { user: me, can } = useAuth();
  const canManage = can('users.manage');
  const addToast = useToast();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [busyId, setBusyId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [created, setCreated] = useState(null);
  const [statusConfirm, setStatusConfirm] = useState(null);
  const [roleConfirm, setRoleConfirm] = useState(null); // { user, role }
  const [editing, setEditing] = useState(null); // user being edited
  const [editForm, setEditForm] = useState({ fullName: '', jobTitle: '', phone: '', phoneCountry: DEFAULT_COUNTRY });
  const [editError, setEditError] = useState('');
  const [copied, setCopied] = useState(false);
  const waStatus = useWhatsAppStatus();
  const waLinked = isLinked(waStatus);
  const [sendOnWhatsApp, setSendOnWhatsApp] = useState(true);
  const [waSend, setWaSend] = useState({ state: 'idle' }); // idle | sending | sent | error
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteTyped, setDeleteTyped] = useState('');
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const list = await api.get('/users');
      setUsers(Array.isArray(list) ? list : []);
    } catch (err) {
      setLoadError(friendlyMessage(err, 'Could not load users.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return users.filter(u =>
      (!q || [u.fullName, u.email, u.jobTitle, u.phone].some(v => String(v || '').toLowerCase().includes(q))) &&
      (roleFilter === 'All' || u.appRole === roleFilter) &&
      (statusFilter === 'All' || (statusFilter === 'Active' ? u.isActive : !u.isActive))
    );
  }, [users, query, roleFilter, statusFilter]);

  const counts = useMemo(() => ({
    active: users.filter(u => u.isActive).length,
    inactive: users.filter(u => !u.isActive).length,
    leaders: users.filter(u => u.isActive && ['Admin', 'CEO'].includes(u.appRole)).length,
  }), [users]);

  const replaceUser = (updated) => setUsers(prev => prev.map(u => (u.id === updated.id ? updated : u)));

  const patchUser = async (target, changes, message, errorTitle = 'Couldn’t update the user') => {
    setBusyId(target.id);
    try {
      const updated = await api.patch(`/users/${target.id}`, changes);
      replaceUser(updated);
      addToast(message(updated), 'success');
      return true;
    } catch (err) {
      addToast({ title: errorTitle, message: friendlyMessage(err, 'Please try again.') }, 'error');
      return false;
    } finally {
      setBusyId(null);
    }
  };

  // Picking a new role asks for confirmation; a deactivated account's role can't be changed.
  const requestRoleChange = (target, role) => {
    if (role === target.appRole) return;
    if (!target.isActive) {
      addToast({
        title: 'Role not changed',
        message: `${target.fullName || target.email} is deactivated. Activate the account before changing its role.`,
      }, 'error');
      return;
    }
    setRoleConfirm({ user: target, role });
  };

  const confirmRoleChange = () => {
    const { user: target, role } = roleConfirm;
    setRoleConfirm(null);
    patchUser(target, { role }, x => ({ title: 'Role changed', message: `${x.fullName || x.email} is now ${x.appRole}. ${ROLE_DESCRIPTIONS[x.appRole] || ''}` }), 'Role not changed');
  };

  const openEdit = (target) => {
    setEditing(target);
    const { iso, national } = splitPhone(target.phone);
    setEditForm({ fullName: target.fullName || '', jobTitle: target.jobTitle || '', phone: national, phoneCountry: iso });
    setEditError('');
  };

  const saveEdit = async (e) => {
    e.preventDefault();
    if (!editForm.fullName.trim()) { setEditError('Enter the person’s full name.'); return; }
    const phone = checkPhone(editForm.phone, dialOf(editForm.phoneCountry));
    if (phone.status === 'invalid') { setEditError(phone.message); return; }
    const ok = await patchUser(editing, { fullName: editForm.fullName.trim(), jobTitle: editForm.jobTitle.trim(), phone: phone.phone || '' },
      x => `${x.fullName}’s details were saved.`, 'Details not saved');
    if (ok) setEditing(null);
  };

  const openDelete = (target) => {
    setDeleteTarget(target);
    setDeleteTyped('');
  };

  // Permanent: the sign-in account and profile are removed; their records stay.
  const confirmDelete = async () => {
    const target = deleteTarget;
    if (!target || deleting) return;
    setDeleting(true);
    try {
      await api.delete(`/users/${target.id}`);
      setUsers(prev => prev.filter(u => u.id !== target.id));
      setDeleteTarget(null);
      addToast({ title: 'User deleted', message: `${target.fullName || target.email} was permanently deleted.` }, 'success');
    } catch (err) {
      addToast({ title: 'User not deleted', message: friendlyMessage(err, 'Please try again.') }, 'error');
    } finally {
      setDeleting(false);
    }
  };

  const shareMessage = created ? signInDetailsMessage({
    fullName: created.user.fullName,
    email: created.user.email,
    password: created.password,
    role: created.user.appRole,
    loginUrl: `${window.location.origin}/login`,
  }) : '';

  const copyDetails = async () => {
    try {
      await navigator.clipboard.writeText(shareMessage);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      addToast({ title: 'Couldn’t copy', message: 'Select the details and copy them manually.' }, 'warning');
    }
  };

  const openAdd = () => {
    setForm({ ...emptyForm, password: generatePassword() });
    setFormError('');
    setCreated(null);
    setCopied(false);
    setWaSend({ state: 'idle' });
    setModalOpen(true);
  };

  // Sends the email + temporary password from the WhatsApp linked in Settings (no WhatsApp window).
  const sendDetailsOnWhatsApp = async (newUser, password) => {
    setWaSend({ state: 'sending' });
    try {
      await api.post('/whatsapp/send', {
        phone: newUser.phone,
        text: signInDetailsMessage({ fullName: newUser.fullName, email: newUser.email, password, role: newUser.appRole, loginUrl: `${window.location.origin}/login` }),
      });
      setWaSend({ state: 'sent' });
      addToast({ title: 'Sign-in details sent', message: `${newUser.fullName} received their email and password on WhatsApp.` }, 'success');
    } catch (err) {
      setWaSend({ state: 'error', message: friendlyMessage(err, 'The WhatsApp message wasn’t sent.') });
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    const fullName = form.fullName.trim();
    const email = form.email.trim().toLowerCase();
    if (!fullName) { setFormError('Enter the person’s full name.'); return; }
    if (!EMAIL_RE.test(email)) { setFormError('Enter a valid email address.'); return; }
    const phone = checkPhone(form.phone, dialOf(form.phoneCountry));
    if (phone.status === 'invalid') { setFormError(phone.message); return; }
    const pwError = passwordProblem(form.password);
    if (pwError) { setFormError(pwError); return; }

    setSaving(true);
    setFormError('');
    try {
      const result = await api.post('/users', { fullName, email, jobTitle: form.jobTitle.trim(), phone: phone.phone || undefined, role: form.role, password: form.password });
      setUsers(prev => [...prev.filter(u => u.id !== result.user.id), result.user]);
      setCreated({ ...result, password: form.password });
      addToast(`${result.user.fullName} added as ${result.user.appRole}.`, 'success');
      if (waLinked && sendOnWhatsApp && isWhatsAppReady(result.user.phone)) sendDetailsOnWhatsApp(result.user, form.password);
    } catch (err) {
      setFormError(friendlyMessage(err, 'Could not create the user.'));
    } finally {
      setSaving(false);
    }
  };

  const set = (key) => (e) => setForm(prev => ({ ...prev, [key]: e.target.value }));

  return (
    <div>
      <PageHeader
        title="Users & Roles"
        subtitle={canManage
          ? 'Add team members, choose what each person can do, and activate or deactivate accounts.'
          : 'Team members and their roles. Only an Admin or CEO can add users or change roles.'}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={load} className="btn-glass" disabled={loading} title="Refresh">
              <RefreshCw size={15} className={loading ? 'animate-spin' : ''} aria-hidden="true" /> Refresh
            </button>
            {canManage && (
              <button type="button" onClick={openAdd} className="btn-primary">
                <Plus size={16} /> Add User
              </button>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard title="Users" value={users.length} subtitle="Sign-in accounts" icon={UsersIcon} iconColor="bg-primary-100 text-brand" />
        <StatCard title="Active" value={counts.active} subtitle="Can use the CRM" icon={UserCheck} iconColor="bg-success/10 text-success" />
        <StatCard title="Inactive" value={counts.inactive} subtitle="Waiting or deactivated" icon={UserX} iconColor="bg-danger/10 text-danger" />
        <StatCard title="Admins & CEOs" value={counts.leaders} subtitle="Can manage users" icon={ShieldCheck} iconColor="primrose" />
      </div>

      <div className="card p-4 mb-6">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          <div className="w-full lg:w-80">
            <SearchInput value={query} onChange={setQuery} placeholder="Search name, email, phone, job title..." />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <FilterDropdown value={roleFilter} onChange={setRoleFilter} options={[{ value: 'All', label: 'All Roles' }, ...ROLES.map(r => ({ value: r, label: r }))]} />
            <FilterDropdown value={statusFilter} onChange={setStatusFilter} options={[{ value: 'All', label: 'All Statuses' }, { value: 'Active', label: 'Active' }, { value: 'Inactive', label: 'Inactive' }]} />
          </div>
        </div>
      </div>

      <div className="card mb-6 overflow-hidden">
        {loading && !users.length ? (
          <LoadingState text="Loading users…" />
        ) : loadError ? (
          <EmptyState title="Users could not be loaded" description={loadError} icon={AlertTriangle}
            action={<button type="button" className="btn-secondary" onClick={load}>Try again</button>} />
        ) : filtered.length === 0 ? (
          <EmptyState title="No users found" description={users.length ? 'Try adjusting your filters or search.' : 'Add the first team member.'} icon={UserCog} />
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Job Title</th>
                  <th>Phone</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Added</th>
                  {canManage && <th className="w-44">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {filtered.map(u => {
                  const isMe = u.id === me?.id;
                  const editable = canManage && !isMe;
                  const busy = busyId === u.id;
                  return (
                    <tr key={u.id} className={u.isActive ? '' : 'opacity-70'}>
                      <td>
                        <div className="flex items-center gap-2.5">
                          <Avatar name={u.fullName || u.email} src={u.avatarUrl} size={32} fallbackClassName="bg-primary-100 text-brand" />
                          <div className="min-w-0">
                            <p className="font-semibold text-gray-900 truncate">{u.fullName || '—'}{isMe && <span className="ms-1.5 text-2xs font-semibold text-gray-400">(you)</span>}</p>
                            <p className="text-2xs text-gray-400 truncate">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td><span className="text-xs text-gray-700">{u.jobTitle || '—'}</span></td>
                      <td>
                        {u.phone ? (
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs text-gray-700 tabular-nums whitespace-nowrap">{formatPhone(u.phone)}</span>
                            {isWhatsAppReady(u.phone) && (
                              <a
                                href={whatsappLink(u.phone)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="grid place-items-center w-6 h-6 rounded-full bg-success-50 text-success-600 hover:bg-success-100 transition-colors"
                                title="Open WhatsApp chat"
                                aria-label={`Open WhatsApp chat with ${u.fullName || u.email}`}
                              >
                                <MessageCircle size={13} aria-hidden="true" />
                              </a>
                            )}
                          </div>
                        ) : <span className="text-xs text-gray-400">—</span>}
                      </td>
                      <td>
                        {editable ? (
                          <select
                            className={`form-select !py-1 !text-xs !w-auto ${u.isActive ? '' : 'opacity-60'}`}
                            value={u.appRole}
                            disabled={busy}
                            onChange={(e) => requestRoleChange(u, e.target.value)}
                            aria-label={`Role for ${u.fullName || u.email}`}
                            title={u.isActive ? 'Change role' : 'Activate this account to change its role'}
                          >
                            {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                          </select>
                        ) : <RoleBadge role={u.appRole} />}
                      </td>
                      <td>
                        <span className={u.isActive ? 'badge-success' : 'badge-danger'}>{u.isActive ? 'Active' : 'Inactive'}</span>
                      </td>
                      <td><span className="text-xs text-gray-500">{u.createdAt ? formatDate(u.createdAt) : '—'}</span></td>
                      {canManage && (
                        <td>
                          {editable ? (
                            <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => openEdit(u)}
                              disabled={busy}
                              className="btn-icon w-8 h-8"
                              title="Edit name, job title and phone"
                              aria-label={`Edit ${u.fullName || u.email}`}
                            >
                              <Pencil size={13} aria-hidden="true" />
                            </button>
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => (u.isActive ? setStatusConfirm(u) : patchUser(u, { isActive: true }, x => `${x.fullName} can now sign in.`))}
                              className={u.isActive ? 'btn-secondary btn-sm' : 'btn-primary btn-sm'}
                            >
                              {u.isActive ? <><UserX size={13} aria-hidden="true" /> Deactivate</> : <><UserCheck size={13} aria-hidden="true" /> Activate</>}
                            </button>
                            <button
                              type="button"
                              onClick={() => openDelete(u)}
                              disabled={busy}
                              className="btn-icon w-8 h-8 text-gray-400 hover:!text-danger-600 hover:!bg-danger-50"
                              title="Delete permanently"
                              aria-label={`Delete ${u.fullName || u.email} permanently`}
                            >
                              <Trash2 size={13} aria-hidden="true" />
                            </button>
                            </div>
                          ) : <span className="text-2xs text-gray-400">{isMe ? 'Your account' : '—'}</span>}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* What each role can do */}
      <div className="card">
        <div className="card-header">
          <div className="flex items-center gap-2.5">
            <span className="grid place-items-center w-8 h-8 rounded-lg bg-primary-100 text-brand" aria-hidden="true"><ShieldCheck size={16} /></span>
            <div>
              <h2 className="text-sm font-semibold text-gray-800">What each role can do</h2>
              <p className="text-xs text-gray-400 mt-0.5">Enforced by the server and the database, not just hidden in the browser.</p>
            </div>
          </div>
        </div>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Permission</th>
                {ROLES.map(r => <th key={r} className="text-center">{r}</th>)}
              </tr>
            </thead>
            <tbody>
              {Object.keys(PERMISSIONS).map(p => (
                <tr key={p}>
                  <td className="text-xs text-gray-700">{PERMISSION_LABELS[p]}</td>
                  {ROLES.map(r => (
                    <td key={r} className="text-center">
                      {PERMISSIONS[p].includes(r)
                        ? <Check size={15} className="inline text-success" aria-label="Allowed" />
                        : <Minus size={15} className="inline text-gray-300" aria-label="Not allowed" />}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add user */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={created ? 'User added' : 'Add User'}
        size="lg"
        footer={created ? (
          <>
            <button type="button" className="btn-secondary" onClick={openAdd}>Add another</button>
            <button type="button" className="btn-primary" onClick={() => setModalOpen(false)}>Done</button>
          </>
        ) : (
          <>
            <button type="button" className="btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
            <button type="submit" form="users-form" className="btn-primary" disabled={saving}>{saving ? 'Creating…' : 'Create User'}</button>
          </>
        )}
      >
        {created ? (
          <div className="space-y-4 text-sm">
            <p className="text-gray-700">
              <strong>{created.user.fullName}</strong> ({created.user.email}) can now use the CRM as <RoleBadge role={created.user.appRole} />.
            </p>
            {created.requiresEmailConfirmation && (
              <p className="text-xs text-warning-700 bg-warning-50 border border-warning-200 rounded-lg px-3 py-2">
                They must click the link in the confirmation email Supabase just sent before they can sign in.
              </p>
            )}
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-xs">
              <p className="font-semibold text-gray-700 mb-1 flex items-center gap-1.5"><KeyRound size={13} aria-hidden="true" /> Temporary password</p>
              <code className="text-sm font-bold text-gray-900 select-all">{created.password}</code>
              <p className="text-gray-500 mt-1.5">It is not shown again. They can change it after signing in, in Settings → Change password.</p>
            </div>

            <div className="rounded-xl border border-success-200 bg-success-50/60 p-3.5">
              <p className="text-xs font-semibold text-gray-800 mb-2.5">Send the sign-in details to {created.user.fullName.split(' ')[0]}</p>
              {waLinked && isWhatsAppReady(created.user.phone) ? (
                <div className="space-y-2">
                  {waSend.state === 'sent' && (
                    <p className="text-xs font-semibold text-success-700 inline-flex items-center gap-1.5">
                      <CheckCircle2 size={14} aria-hidden="true" /> Sent on WhatsApp to {formatPhone(created.user.phone)} from your linked number.
                    </p>
                  )}
                  {waSend.state === 'sending' && (
                    <p className="text-xs text-gray-600 inline-flex items-center gap-1.5"><Loader2 size={13} className="animate-spin" aria-hidden="true" /> Sending on WhatsApp…</p>
                  )}
                  {waSend.state === 'error' && <p role="alert" className="form-error">{waSend.message}</p>}
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => sendDetailsOnWhatsApp(created.user, created.password)}
                      disabled={waSend.state === 'sending'}
                      className={waSend.state === 'sent' ? 'btn-secondary btn-sm' : 'btn-primary !bg-[#25D366] !text-white !border-transparent hover:!bg-[#1ebe5a]'}
                    >
                      {waSend.state === 'sent'
                        ? <><RotateCw size={13} aria-hidden="true" /> Send again</>
                        : waSend.state === 'error'
                          ? <><RotateCw size={14} aria-hidden="true" /> Try again</>
                          : <><Send size={14} aria-hidden="true" /> Send on WhatsApp ({formatPhone(created.user.phone)})</>}
                    </button>
                    <button type="button" className="btn-secondary btn-sm" onClick={copyDetails}>
                      {copied ? <><Check size={13} aria-hidden="true" /> Copied</> : <><Copy size={13} aria-hidden="true" /> Copy details</>}
                    </button>
                  </div>
                  <p className="text-2xs text-gray-500">Sent from your linked WhatsApp {formatPhone(waStatus.phone)}: their email, temporary password, role and the sign-in link.</p>
                </div>
              ) : (
              <>
              <div className="flex flex-wrap items-center gap-2">
                {isWhatsAppReady(created.user.phone) ? (
                  <a
                    href={whatsappLink(created.user.phone, shareMessage)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary !bg-[#25D366] !text-white !border-transparent hover:!bg-[#1ebe5a]"
                  >
                    <MessageCircle size={15} aria-hidden="true" /> Send on WhatsApp ({formatPhone(created.user.phone)})
                  </a>
                ) : (
                  <span className="text-2xs text-gray-500 inline-flex items-center gap-1.5">
                    <Phone size={12} aria-hidden="true" />
                    {created.user.phone ? `${formatPhone(created.user.phone)} isn’t a mobile number, so WhatsApp isn’t available.` : 'No phone number was added, so WhatsApp isn’t available.'}
                  </span>
                )}
                <button type="button" className="btn-secondary btn-sm" onClick={copyDetails}>
                  {copied ? <><Check size={13} aria-hidden="true" /> Copied</> : <><Copy size={13} aria-hidden="true" /> Copy details</>}
                </button>
              </div>
              <p className="text-2xs text-gray-500 mt-2">
                WhatsApp opens with the message ready; press send.{' '}
                <Link to="/settings#whatsapp" onClick={() => setModalOpen(false)} className="font-semibold text-brand hover:underline">Link your WhatsApp in Settings</Link> to send it automatically.
              </p>
              </>
              )}
            </div>
          </div>
        ) : (
          <form id="users-form" onSubmit={submit} className="space-y-4" noValidate>
            {formError && <p role="alert" className="text-xs text-danger bg-danger/5 border border-danger/20 rounded-lg px-3 py-2">{formError}</p>}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="users-name" className="form-label">Full Name *</label>
                <input id="users-name" type="text" className="form-input" value={form.fullName} onChange={set('fullName')} placeholder="e.g. Samira Khan" />
              </div>
              <div>
                <label htmlFor="users-email" className="form-label">Email *</label>
                <input id="users-email" type="email" className="form-input" value={form.email} onChange={set('email')} placeholder="name@company.com" />
              </div>
            </div>
            <div>
              <label htmlFor="users-phone" className="form-label">Phone / WhatsApp</label>
              <PhoneInput
                id="users-phone"
                country={form.phoneCountry}
                onCountryChange={(iso) => setForm(prev => ({ ...prev, phoneCountry: iso }))}
                value={form.phone}
                onChange={(v) => setForm(prev => ({ ...prev, phone: v }))}
                invalid={checkPhone(form.phone, dialOf(form.phoneCountry)).status === 'invalid'}
              />
              <PhoneHint value={form.phone} country={form.phoneCountry} />
              {waLinked && checkPhone(form.phone, dialOf(form.phoneCountry)).status === 'ready' && (
                <label className="mt-2 flex items-center gap-2 cursor-pointer select-none w-max">
                  <input type="checkbox" className="w-4 h-4" checked={sendOnWhatsApp} onChange={(e) => setSendOnWhatsApp(e.target.checked)} />
                  <span className="text-xs text-gray-700">Send their email and password on WhatsApp from {formatPhone(waStatus.phone)}</span>
                </label>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="users-title" className="form-label">Job Title</label>
                <input id="users-title" type="text" className="form-input" value={form.jobTitle} onChange={set('jobTitle')} placeholder="e.g. Sales Executive" />
              </div>
              <div>
                <label htmlFor="users-role" className="form-label">Role *</label>
                <select id="users-role" className="form-select" value={form.role} onChange={set('role')}>
                  {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
                <p className="text-2xs text-gray-500 mt-1">{ROLE_DESCRIPTIONS[form.role]}</p>
              </div>
            </div>
            <div>
              <label htmlFor="users-password" className="form-label">Temporary Password *</label>
              <div className="flex gap-2">
                <input id="users-password" type="text" autoComplete="new-password" className="form-input font-mono" value={form.password} onChange={set('password')} />
                <button type="button" className="btn-secondary shrink-0" onClick={() => setForm(prev => ({ ...prev, password: generatePassword() }))}>Generate</button>
              </div>
              <p className="text-2xs text-gray-500 mt-1">At least 8 characters with three of: lower case, upper case, a number, a symbol.</p>
            </div>
          </form>
        )}
      </Modal>

      <ConfirmDialog
        isOpen={!!statusConfirm}
        onClose={() => setStatusConfirm(null)}
        onConfirm={() => { const u = statusConfirm; setStatusConfirm(null); patchUser(u, { isActive: false }, x => `${x.fullName} can no longer sign in.`); }}
        title="Deactivate User"
        confirmLabel="Deactivate"
        message={`Deactivate ${statusConfirm?.fullName || statusConfirm?.email}? They will be signed out and lose access to the CRM. You can activate them again at any time.`}
      />

      <Modal
        isOpen={!!deleteTarget}
        onClose={() => !deleting && setDeleteTarget(null)}
        title="Delete user permanently"
        size="sm"
        footer={
          <>
            <button type="button" className="btn-secondary" onClick={() => setDeleteTarget(null)} disabled={deleting}>Cancel</button>
            <button
              type="button"
              className="btn-danger"
              onClick={confirmDelete}
              disabled={deleting || deleteTyped.trim().toLowerCase() !== String(deleteTarget?.email || '').toLowerCase()}
            >
              {deleting ? 'Deleting…' : 'Delete permanently'}
            </button>
          </>
        }
      >
        {deleteTarget && (
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-3">
              <span className="grid place-items-center w-10 h-10 rounded-full bg-danger-50 text-danger-600 shrink-0"><Trash2 size={18} aria-hidden="true" /></span>
              <p className="text-gray-700">
                <strong>{deleteTarget.fullName || deleteTarget.email}</strong> will lose access and their sign-in account will be removed. <strong>This can’t be undone.</strong> Leads, deals and other records they created are kept.
              </p>
            </div>
            {deleteTarget.isActive && (
              <p className="text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                Only need to stop them signing in for now? Use <strong>Deactivate</strong> instead. You can turn it back on later.
              </p>
            )}
            <div>
              <label htmlFor="delete-confirm" className="form-label">Type <span className="font-mono text-gray-900">{deleteTarget.email}</span> to confirm</label>
              <input id="delete-confirm" className="form-input" autoComplete="off" value={deleteTyped} onChange={(e) => setDeleteTyped(e.target.value)} />
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        isOpen={!!roleConfirm}
        onClose={() => setRoleConfirm(null)}
        onConfirm={confirmRoleChange}
        title="Change Role"
        confirmLabel="Change role"
        variant="primary"
        message={roleConfirm ? `Change ${roleConfirm.user.fullName || roleConfirm.user.email} from ${roleConfirm.user.appRole} to ${roleConfirm.role}? ${ROLE_DESCRIPTIONS[roleConfirm.role] || ''}` : ''}
      />

      <Modal
        isOpen={!!editing}
        onClose={() => setEditing(null)}
        title="Edit User"
        size="md"
        footer={
          <>
            <button type="button" className="btn-secondary" onClick={() => setEditing(null)}>Cancel</button>
            <button type="submit" form="users-edit-form" className="btn-primary" disabled={busyId === editing?.id}>{busyId === editing?.id ? 'Saving…' : 'Save'}</button>
          </>
        }
      >
        <form id="users-edit-form" onSubmit={saveEdit} className="space-y-4" noValidate>
          {editError && <p role="alert" className="text-xs text-danger bg-danger/5 border border-danger/20 rounded-lg px-3 py-2">{editError}</p>}
          <p className="text-xs text-gray-500">{editing?.email}</p>
          <div>
            <label htmlFor="users-edit-name" className="form-label">Full Name *</label>
            <input id="users-edit-name" type="text" className="form-input" value={editForm.fullName} onChange={(e) => setEditForm(f => ({ ...f, fullName: e.target.value }))} />
          </div>
          <div>
            <label htmlFor="users-edit-title" className="form-label">Job Title</label>
            <input id="users-edit-title" type="text" className="form-input" value={editForm.jobTitle} onChange={(e) => setEditForm(f => ({ ...f, jobTitle: e.target.value }))} />
          </div>
          <div>
            <label htmlFor="users-edit-phone" className="form-label">Phone / WhatsApp</label>
            <PhoneInput
              id="users-edit-phone"
              country={editForm.phoneCountry}
              onCountryChange={(iso) => setEditForm(f => ({ ...f, phoneCountry: iso }))}
              value={editForm.phone}
              onChange={(v) => setEditForm(f => ({ ...f, phone: v }))}
              invalid={checkPhone(editForm.phone, dialOf(editForm.phoneCountry)).status === 'invalid'}
            />
            <PhoneHint value={editForm.phone} country={editForm.phoneCountry} />
          </div>
        </form>
      </Modal>
    </div>
  );
}
