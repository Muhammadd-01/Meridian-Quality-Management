import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { MessageCircle, Send, Copy, Check, ExternalLink, Loader2, QrCode } from 'lucide-react';
import Modal from '../ui/Modal';
import PhoneInput from '../ui/PhoneInput';
import { useToast } from '../ui/Toast';
import { api } from '../../lib/api';
import { friendlyMessage } from '../../lib/errors';
import { checkPhone, formatPhone, splitPhone, whatsappLink } from '../../lib/phone';
import { countryByIso } from '../../data/countries';
import { isLinked, useWhatsAppStatus } from '../../lib/whatsapp';

/**
 * Green WhatsApp icon for a table row. Opens a window with the record's
 * details as a ready message; sends it from the user's linked WhatsApp
 * (Settings → WhatsApp), or opens WhatsApp when nothing is linked yet.
 *
 * @param {{ title: string, message: () => string, phone?: string, label?: string }} props
 *   `message` is built only when the window opens.
 */
export default function WhatsAppSendButton({ title, message, phone: defaultPhone, label }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="p-1.5 rounded-lg text-[#1f9d55] hover:text-[#167a41] hover:bg-success-50 transition-colors"
        title={label || 'Send on WhatsApp'}
        aria-label={`${label || 'Send on WhatsApp'}: ${title}`}
      >
        <MessageCircle size={14} />
      </button>
      {open && <SendDialog title={title} initialText={message()} defaultPhone={defaultPhone} onClose={() => setOpen(false)} />}
    </>
  );
}

function SendDialog({ title, initialText, defaultPhone, onClose }) {
  const status = useWhatsAppStatus();
  const linked = isLinked(status);
  const addToast = useToast();
  const initial = checkPhone(defaultPhone || '');
  const split = initial.phone ? splitPhone(initial.phone) : { iso: 'PK', national: '' };
  const [country, setCountry] = useState(split.iso);
  const [number, setNumber] = useState(split.national);
  const [text, setText] = useState(initialText);
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const [copied, setCopied] = useState(false);

  const target = checkPhone(number, countryByIso(country).dial);
  const validNumber = target.status === 'ready' || target.status === 'landline';

  const send = async () => {
    if (!validNumber) { setError(number ? target.message : 'Enter the WhatsApp number to send to.'); return; }
    if (!text.trim()) { setError('The message is empty.'); return; }
    setSending(true);
    setError('');
    try {
      await api.post('/whatsapp/send', { phone: target.phone, text: text.trim() });
      addToast({ title: 'Sent on WhatsApp', message: `${title} was sent to ${formatPhone(target.phone)}.` }, 'success');
      onClose();
    } catch (err) {
      setError(friendlyMessage(err, 'The message wasn’t sent. Please try again.'));
    } finally {
      setSending(false);
    }
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError('Couldn’t copy. Select the message and copy it manually.');
    }
  };

  return (
    <Modal
      isOpen
      onClose={onClose}
      title="Send on WhatsApp"
      size="md"
      footer={
        <>
          <button type="button" className="btn-secondary" onClick={copy}>
            {copied ? <><Check size={14} aria-hidden="true" /> Copied</> : <><Copy size={14} aria-hidden="true" /> Copy</>}
          </button>
          {linked ? (
            <button type="button" className="btn-primary !bg-[#25D366] !text-white !border-transparent hover:!bg-[#1ebe5a]" onClick={send} disabled={sending}>
              {sending ? <><Loader2 size={14} className="animate-spin" aria-hidden="true" /> Sending…</> : <><Send size={14} aria-hidden="true" /> Send</>}
            </button>
          ) : (
            <a
              href={validNumber ? whatsappLink(target.phone, text) : undefined}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => { if (!validNumber) { e.preventDefault(); setError(number ? target.message : 'Enter the WhatsApp number to send to.'); } }}
              className={`btn-primary !bg-[#25D366] !text-white !border-transparent hover:!bg-[#1ebe5a] ${validNumber ? '' : 'opacity-60'}`}
            >
              <ExternalLink size={14} aria-hidden="true" /> Open WhatsApp
            </a>
          )}
        </>
      }
    >
      <div className="space-y-4">
        {linked ? (
          <p className="text-xs text-gray-600 flex items-center gap-1.5">
            <MessageCircle size={13} className="text-[#1f9d55]" aria-hidden="true" />
            Sends from your WhatsApp {formatPhone(status.phone)} without opening WhatsApp.
          </p>
        ) : (
          <p className="text-xs text-gray-600 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 flex items-start gap-2">
            <QrCode size={14} className="text-gray-400 mt-0.5 shrink-0" aria-hidden="true" />
            <span>
              Your WhatsApp isn’t linked, so this opens WhatsApp with the message ready.{' '}
              <Link to="/settings#whatsapp" onClick={onClose} className="font-semibold text-brand hover:underline">Link it in Settings</Link> to send directly.
            </span>
          </p>
        )}

        <div>
          <label htmlFor="wa-send-phone" className="form-label">To (WhatsApp number) *</label>
          <PhoneInput
            id="wa-send-phone"
            country={country}
            onCountryChange={setCountry}
            value={number}
            onChange={(v) => { setNumber(v); setError(''); }}
            invalid={target.status === 'invalid'}
          />
          {target.status === 'landline' && <p className="text-2xs text-warning-700 mt-1">{target.message}</p>}
        </div>

        <div>
          <label htmlFor="wa-send-text" className="form-label">Message</label>
          <textarea
            id="wa-send-text"
            rows={9}
            className="form-input font-mono text-[12.5px] leading-relaxed"
            value={text}
            onChange={(e) => { setText(e.target.value); setError(''); }}
            maxLength={4000}
          />
          <p className="text-2xs text-gray-400 mt-1">You can edit the message before sending. *text* shows in bold on WhatsApp.</p>
        </div>

        {error && <p role="alert" className="form-error">{error}</p>}
      </div>
    </Modal>
  );
}
