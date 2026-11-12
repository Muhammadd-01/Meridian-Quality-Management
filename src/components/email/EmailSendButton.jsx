import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Send, Loader2, ExternalLink, ListPlus, AtSign } from 'lucide-react';
import Modal from '../ui/Modal';
import { useToast } from '../ui/Toast';
import { api } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { friendlyMessage } from '../../lib/errors';
import { useEmailAccount } from '../../lib/emailAccount';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const splitAddresses = (v) => String(v || '').split(/[,;\s]+/).map(s => s.trim()).filter(Boolean);
const plain = (text) => String(text || '').replace(/\*/g, '');

/**
 * Envelope icon for a table row: writes an email to the record's person from
 * the user's connected mailbox (Settings → Email), or opens the user's email
 * app when nothing is connected yet.
 *
 * @param {{ title: string, to?: string, name?: string, subject?: string, details: () => string }} props
 */
export default function EmailSendButton({ title, to, name, subject, details }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="p-1.5 rounded-lg text-teal-700 hover:text-teal-900 hover:bg-primary-50 transition-colors"
        title="Send email"
        aria-label={`Send email: ${title}`}
      >
        <Mail size={14} />
      </button>
      {open && <ComposeDialog title={title} to={to} name={name} subject={subject} details={details} onClose={() => setOpen(false)} />}
    </>
  );
}

function ComposeDialog({ title, to, name, subject, details, onClose }) {
  const account = useEmailAccount();
  const { user } = useAuth();
  const addToast = useToast();
  const connected = !!account?.connected;
  const sender = account?.displayName || user?.fullName || '';
  const first = String(name || '').trim().split(/\s+/)[0];
  const [recipients, setRecipients] = useState(to || '');
  const [cc, setCc] = useState('');
  const [subj, setSubj] = useState(subject || '');
  const [body, setBody] = useState(`${first ? `Dear ${first},` : 'Hello,'}\n\n\n\nBest regards,\n${sender}`);
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);

  const toList = splitAddresses(recipients);
  const ccList = splitAddresses(cc);
  const problem = !toList.length
    ? 'Add at least one recipient.'
    : [...toList, ...ccList].find(a => !EMAIL_RE.test(a)) ? `“${[...toList, ...ccList].find(a => !EMAIL_RE.test(a))}” isn’t a valid email address.`
      : !subj.trim() ? 'Add a subject.' : !body.trim() ? 'The message is empty.' : '';

  const insertDetails = () => {
    const block = plain(details());
    setBody(b => {
      const marker = '\n\nBest regards,';
      const i = b.lastIndexOf(marker);
      return i >= 0 ? `${b.slice(0, i).trimEnd()}\n\n${block}${b.slice(i)}` : `${b.trimEnd()}\n\n${block}`;
    });
  };

  const send = async () => {
    if (problem) { setError(problem); return; }
    setSending(true);
    setError('');
    try {
      await api.post('/email/send', { to: toList, cc: ccList.length ? ccList : undefined, subject: subj.trim(), body: body.trim() });
      addToast({ title: 'Email sent', message: `Sent to ${toList.join(', ')} from ${account.email}.` }, 'success');
      onClose();
    } catch (err) {
      setError(friendlyMessage(err, 'The email wasn’t sent. Please try again.'));
    } finally {
      setSending(false);
    }
  };

  const mailto = `mailto:${encodeURIComponent(toList.join(','))}?${new URLSearchParams({ ...(ccList.length ? { cc: ccList.join(',') } : {}), subject: subj, body }).toString().replace(/\+/g, '%20')}`;

  return (
    <Modal
      isOpen
      onClose={onClose}
      title="New email"
      size="lg"
      footer={
        <>
          <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          {connected ? (
            <button type="button" className="btn-primary" onClick={send} disabled={sending}>
              {sending ? <><Loader2 size={14} className="animate-spin" aria-hidden="true" /> Sending…</> : <><Send size={14} aria-hidden="true" /> Send</>}
            </button>
          ) : (
            <a href={problem ? undefined : mailto} onClick={(e) => { if (problem) { e.preventDefault(); setError(problem); } }} className="btn-primary">
              <ExternalLink size={14} aria-hidden="true" /> Open in email app
            </a>
          )}
        </>
      }
    >
      <div className="space-y-3.5">
        {connected ? (
          <p className="text-xs text-gray-600 flex items-center gap-1.5"><AtSign size={13} className="text-teal-700" aria-hidden="true" /> From <strong className="text-gray-800">{account.displayName ? `${account.displayName} <${account.email}>` : account.email}</strong></p>
        ) : (
          <p className="text-xs text-gray-600 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
            Your email isn’t connected, so this opens your email app with the message ready.{' '}
            <Link to="/settings#email" onClick={onClose} className="font-semibold text-brand hover:underline">Connect it in Settings</Link> to send from the CRM.
          </p>
        )}
        <div>
          <label htmlFor="mail-to" className="form-label">To *</label>
          <input id="mail-to" className="form-input" value={recipients} onChange={(e) => { setRecipients(e.target.value); setError(''); }} placeholder="name@company.com (separate several with commas)" />
        </div>
        <div>
          <label htmlFor="mail-cc" className="form-label">Cc</label>
          <input id="mail-cc" className="form-input" value={cc} onChange={(e) => { setCc(e.target.value); setError(''); }} placeholder="Optional" />
        </div>
        <div>
          <label htmlFor="mail-subject" className="form-label">Subject *</label>
          <input id="mail-subject" className="form-input" value={subj} onChange={(e) => { setSubj(e.target.value); setError(''); }} maxLength={200} />
        </div>
        <div>
          <div className="flex items-center justify-between gap-2">
            <label htmlFor="mail-body" className="form-label !mb-0">Message *</label>
            <button type="button" onClick={insertDetails} className="text-2xs font-semibold text-brand hover:text-brand-strong inline-flex items-center gap-1">
              <ListPlus size={12} aria-hidden="true" /> Insert {title.split(':')[0].toLowerCase()} details
            </button>
          </div>
          <textarea id="mail-body" rows={11} className="form-input mt-1.5 text-[13px] leading-relaxed" value={body} onChange={(e) => { setBody(e.target.value); setError(''); }} />
        </div>
        {error && <p role="alert" className="form-error">{error}</p>}
      </div>
    </Modal>
  );
}
