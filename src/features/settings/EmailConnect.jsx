import React, { useEffect, useState } from 'react';
import { AtSign, CheckCircle2, ExternalLink, Eye, EyeOff, Loader2, Mail, PlugZap, Unlink } from 'lucide-react';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { useToast } from '../../components/ui/Toast';
import { api } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { friendlyMessage } from '../../lib/errors';
import { EMAIL_PROVIDERS, guessProvider, setEmailAccount, useEmailAccount } from '../../lib/emailAccount';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Settings → Email: connect your own mailbox with an app password, so emails
 * to leads, contacts and accounts are sent from your address.
 */
export default function EmailConnect() {
  const { user } = useAuth();
  const account = useEmailAccount();
  const addToast = useToast();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ email: '', displayName: '', provider: 'gmail', password: '', host: '', port: 465, security: 'ssl' });
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [confirmDisconnect, setConfirmDisconnect] = useState(false);

  useEffect(() => {
    if (!editing) return;
    const email = account?.email || user?.email || '';
    setForm(f => ({ ...f, email, displayName: account?.displayName || user?.fullName || '', provider: account?.provider || guessProvider(email), password: '' }));
    setError('');
  }, [editing]); // eslint-disable-line react-hooks/exhaustive-deps

  const provider = EMAIL_PROVIDERS.find(p => p.id === form.provider) || EMAIL_PROVIDERS[0];
  const set = (key) => (e) => { const v = e.target.value; setForm(f => ({ ...f, [key]: v })); setError(''); };

  const connect = async (e) => {
    e.preventDefault();
    if (!EMAIL_RE.test(form.email.trim())) { setError('Enter your email address.'); return; }
    if (!form.password) { setError('Enter the app password.'); return; }
    if (form.provider === 'custom' && !form.host.trim()) { setError('Enter the mail server (SMTP host).'); return; }
    setSaving(true);
    setError('');
    try {
      const saved = await api.put('/email/account', {
        email: form.email.trim(),
        displayName: form.displayName.trim(),
        provider: form.provider,
        password: form.password,
        ...(form.provider === 'custom' ? { host: form.host.trim(), port: Number(form.port), security: form.security } : {}),
      });
      setEmailAccount(saved);
      setEditing(false);
      addToast({ title: 'Email connected', message: `Emails will be sent from ${saved.email}.` }, 'success');
    } catch (err) {
      setError(friendlyMessage(err, 'Couldn’t connect. Check the details and try again.'));
    } finally {
      setSaving(false);
      setForm(f => ({ ...f, password: '' }));
    }
  };

  const disconnect = async () => {
    setConfirmDisconnect(false);
    try {
      setEmailAccount(await api.delete('/email/account'));
      addToast({ title: 'Email disconnected', message: 'The CRM no longer sends from your email.' }, 'success');
    } catch (err) {
      addToast({ title: 'Couldn’t disconnect', message: friendlyMessage(err, 'Please try again.') }, 'error');
    }
  };

  if (!account) return <p className="text-sm text-gray-500 inline-flex items-center gap-2"><Loader2 size={14} className="animate-spin" aria-hidden="true" /> Checking email…</p>;

  if (account.unavailable && !editing) {
    return <p className="text-sm text-gray-600">{account.message || 'Email sending isn’t available right now.'}</p>;
  }

  if (account.connected && !editing) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3 rounded-xl border border-primary-200 bg-primary-50/60 p-3.5">
          <span className="grid place-items-center w-11 h-11 rounded-full bg-teal-800 text-primrose shrink-0"><Mail size={19} aria-hidden="true" /></span>
          <div className="min-w-0">
            <p className="text-sm font-bold text-gray-900 flex items-center gap-1.5"><CheckCircle2 size={14} className="text-success-600" aria-hidden="true" /> Connected</p>
            <p className="text-xs text-gray-600 truncate">{[account.displayName, account.email].filter(Boolean).join(' · ')}</p>
          </div>
        </div>
        <p className="text-xs text-gray-500">Use the email button on any lead, deal, contact or account to send from this address.</p>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn-secondary btn-sm" onClick={() => setEditing(true)}><PlugZap size={13} aria-hidden="true" /> Change</button>
          <button type="button" className="btn-secondary btn-sm" onClick={() => setConfirmDisconnect(true)}><Unlink size={13} aria-hidden="true" /> Disconnect</button>
        </div>
        <ConfirmDialog
          isOpen={confirmDisconnect}
          onClose={() => setConfirmDisconnect(false)}
          onConfirm={disconnect}
          title="Disconnect email"
          confirmLabel="Disconnect"
          message="Stop sending from your email? The saved app password is deleted. You can connect again at any time."
        />
      </div>
    );
  }

  if (!editing) {
    return (
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <span className="grid place-items-center w-11 h-11 rounded-full bg-gray-100 text-gray-500 shrink-0"><AtSign size={20} aria-hidden="true" /></span>
          <p className="text-sm text-gray-600">Connect your own email to send messages to leads, contacts and accounts straight from the CRM, from your address.</p>
        </div>
        <button type="button" className="btn-primary" onClick={() => setEditing(true)}><Mail size={15} aria-hidden="true" /> Connect email</button>
      </div>
    );
  }

  return (
    <form onSubmit={connect} className="space-y-4 animate-fade-in" noValidate>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label htmlFor="mail-email" className="form-label">Your email *</label>
          <input id="mail-email" type="email" className="form-input" value={form.email}
            onChange={(e) => { const v = e.target.value; setForm(f => ({ ...f, email: v, provider: guessProvider(v) })); setError(''); }} />
        </div>
        <div>
          <label htmlFor="mail-name" className="form-label">Name shown to recipients</label>
          <input id="mail-name" className="form-input" value={form.displayName} onChange={set('displayName')} />
        </div>
      </div>

      <div>
        <label htmlFor="mail-provider" className="form-label">Email provider</label>
        <select id="mail-provider" className="form-select" value={form.provider} onChange={set('provider')}>
          {EMAIL_PROVIDERS.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
        </select>
      </div>

      {form.provider === 'custom' && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-1">
            <label htmlFor="mail-host" className="form-label">SMTP server *</label>
            <input id="mail-host" className="form-input" placeholder="mail.company.com" value={form.host} onChange={set('host')} />
          </div>
          <div>
            <label htmlFor="mail-port" className="form-label">Port</label>
            <select id="mail-port" className="form-select" value={form.port} onChange={(e) => { const port = Number(e.target.value); setForm(f => ({ ...f, port, security: port === 465 ? 'ssl' : 'starttls' })); }}>
              {[465, 587, 25, 2525].map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="mail-security" className="form-label">Security</label>
            <select id="mail-security" className="form-select" value={form.security} onChange={set('security')}>
              <option value="ssl">SSL/TLS</option>
              <option value="starttls">STARTTLS</option>
            </select>
          </div>
        </div>
      )}

      <div>
        <label htmlFor="mail-password" className="form-label">App password *</label>
        <div className="relative">
          <input id="mail-password" type={show ? 'text' : 'password'} autoComplete="off" className="form-input pr-10 font-mono" value={form.password} onChange={set('password')} placeholder="e.g. abcd efgh ijkl mnop" />
          <button type="button" onClick={() => setShow(s => !s)} className="absolute right-2 top-1/2 -translate-y-1/2 btn-icon w-7 h-7" aria-label={show ? 'Hide password' : 'Show password'}>{show ? <EyeOff size={14} /> : <Eye size={14} />}</button>
        </div>
        <p className="text-2xs text-gray-500 mt-1">
          {provider.help}{' '}
          {provider.helpUrl && <a href={provider.helpUrl} target="_blank" rel="noopener noreferrer" className="font-semibold text-brand hover:underline inline-flex items-center gap-0.5">Open <ExternalLink size={10} aria-hidden="true" /></a>}
        </p>
        <p className="text-2xs text-gray-400 mt-1">We sign in to your mail server once to check it. The password is stored encrypted and used only to send your emails.</p>
      </div>

      {error && <p role="alert" className="form-error">{error}</p>}

      <div className="flex flex-wrap gap-2">
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? <><Loader2 size={14} className="animate-spin" aria-hidden="true" /> Checking…</> : <><PlugZap size={14} aria-hidden="true" /> Connect</>}
        </button>
        <button type="button" className="btn-ghost" onClick={() => setEditing(false)} disabled={saving}>Cancel</button>
      </div>
    </form>
  );
}
