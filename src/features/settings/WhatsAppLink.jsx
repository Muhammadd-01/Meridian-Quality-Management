import React, { useEffect, useRef, useState } from 'react';
import { Loader2, MessageCircle, QrCode, RefreshCw, Smartphone, Unlink, AlertTriangle, CheckCircle2 } from 'lucide-react';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { useToast } from '../../components/ui/Toast';
import { api } from '../../lib/api';
import { friendlyMessage } from '../../lib/errors';
import { formatPhone } from '../../lib/phone';
import { refreshWhatsAppStatus, setWhatsAppStatus, useWhatsAppStatus } from '../../lib/whatsapp';

/**
 * Settings → WhatsApp: link your own WhatsApp by scanning a QR (like WhatsApp
 * Web). Once linked, leads, deals, contacts and accounts can be sent from the
 * CRM without opening WhatsApp.
 */
export default function WhatsAppLink() {
  const status = useWhatsAppStatus();
  const addToast = useToast();
  const [busy, setBusy] = useState(false);
  const [confirmUnlink, setConfirmUnlink] = useState(false);
  const previous = useRef(status?.state);
  const state = status?.state;

  // While a QR is showing (or the phone is finishing the link), check every 2.5 s.
  useEffect(() => {
    if (state !== 'qr' && state !== 'connecting') return undefined;
    const t = setInterval(() => refreshWhatsAppStatus(), 2500);
    return () => clearInterval(t);
  }, [state]);

  useEffect(() => {
    if (previous.current && previous.current !== 'connected' && state === 'connected') {
      addToast({ title: 'WhatsApp linked', message: `Messages will be sent from ${formatPhone(status.phone) || 'your WhatsApp'}.` }, 'success');
    }
    previous.current = state;
  }, [state, status?.phone, addToast]);

  const link = async () => {
    setBusy(true);
    try {
      setWhatsAppStatus(await api.post('/whatsapp/connect'));
    } catch (err) {
      addToast({ title: 'Couldn’t start linking', message: friendlyMessage(err, 'Please try again.') }, 'error');
    } finally {
      setBusy(false);
    }
  };

  const unlink = async () => {
    setConfirmUnlink(false);
    setBusy(true);
    try {
      setWhatsAppStatus(await api.post('/whatsapp/logout'));
      addToast({ title: 'WhatsApp unlinked', message: 'The CRM can no longer send from your WhatsApp.' }, 'success');
    } catch (err) {
      addToast({ title: 'Couldn’t unlink', message: friendlyMessage(err, 'Please try again.') }, 'error');
    } finally {
      setBusy(false);
    }
  };

  if (!status) return <p className="text-sm text-gray-500 inline-flex items-center gap-2"><Loader2 size={14} className="animate-spin" aria-hidden="true" /> Checking WhatsApp…</p>;

  if (state === 'unavailable') {
    return (
      <div className="space-y-3">
        <p className="text-sm text-gray-600 flex items-start gap-2">
          <AlertTriangle size={16} className="text-warning-600 mt-0.5 shrink-0" aria-hidden="true" />
          WhatsApp linking isn’t available right now. Please try again shortly.
        </p>
        <button type="button" className="btn-secondary btn-sm" onClick={() => refreshWhatsAppStatus()}><RefreshCw size={13} aria-hidden="true" /> Try again</button>
      </div>
    );
  }

  if (state === 'connected') {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3 rounded-xl border border-success-200 bg-success-50/60 p-3.5">
          <span className="grid place-items-center w-11 h-11 rounded-full bg-[#25D366] text-white shrink-0"><MessageCircle size={20} aria-hidden="true" /></span>
          <div className="min-w-0">
            <p className="text-sm font-bold text-gray-900 flex items-center gap-1.5"><CheckCircle2 size={14} className="text-success-600" aria-hidden="true" /> Linked</p>
            <p className="text-xs text-gray-600 truncate">{[status.name, formatPhone(status.phone)].filter(Boolean).join(' · ')}</p>
          </div>
        </div>
        <p className="text-xs text-gray-500">Use the green WhatsApp button on any lead, deal, contact or account to send its details from this number.</p>
        <button type="button" className="btn-secondary btn-sm" onClick={() => setConfirmUnlink(true)} disabled={busy}>
          <Unlink size={13} aria-hidden="true" /> Unlink WhatsApp
        </button>
        <ConfirmDialog
          isOpen={confirmUnlink}
          onClose={() => setConfirmUnlink(false)}
          onConfirm={unlink}
          title="Unlink WhatsApp"
          confirmLabel="Unlink"
          message="Stop sending from your WhatsApp? You can link it again at any time by scanning a new QR code."
        />
      </div>
    );
  }

  if (state === 'qr' && status.qr) {
    return (
      <div className="flex flex-col sm:flex-row gap-5 items-start">
        <div className="rounded-2xl border border-gray-200 bg-white p-3 shadow-sm shrink-0">
          <img src={status.qr} alt="WhatsApp link QR code" width="220" height="220" className="w-[220px] h-[220px]" />
        </div>
        <div className="space-y-3 text-sm text-gray-700">
          <p className="font-semibold text-gray-900">Scan with your phone</p>
          <ol className="list-decimal ps-5 space-y-1.5 text-[13px]">
            <li>Open <strong>WhatsApp</strong> on your phone.</li>
            <li>Tap <strong>⋮ Menu</strong> (Android) or <strong>Settings</strong> (iPhone) → <strong>Linked devices</strong>.</li>
            <li>Tap <strong>Link a device</strong> and point the camera at this code.</li>
          </ol>
          <p className="text-2xs text-gray-400 inline-flex items-center gap-1.5"><Loader2 size={11} className="animate-spin" aria-hidden="true" /> Waiting for the scan… the code refreshes by itself.</p>
        </div>
      </div>
    );
  }

  if (state === 'connecting') {
    return <p className="text-sm text-gray-600 inline-flex items-center gap-2"><Loader2 size={14} className="animate-spin" aria-hidden="true" /> Connecting to WhatsApp…</p>;
  }

  // disconnected
  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3">
        <span className="grid place-items-center w-11 h-11 rounded-full bg-gray-100 text-gray-500 shrink-0"><Smartphone size={20} aria-hidden="true" /></span>
        <p className="text-sm text-gray-600">
          Link your WhatsApp to send leads, deals, contacts and accounts straight from the CRM, without downloading files or opening WhatsApp.
        </p>
      </div>
      {status.error && <p role="alert" className="form-error">{status.error}</p>}
      <p className="text-2xs text-gray-500 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
        This works like WhatsApp Web. Only message people who expect it and avoid sending many messages at once, so WhatsApp doesn’t limit your number.
      </p>
      <button type="button" className="btn-primary !bg-[#25D366] !text-white !border-transparent hover:!bg-[#1ebe5a]" onClick={link} disabled={busy}>
        {busy ? <><Loader2 size={15} className="animate-spin" aria-hidden="true" /> Getting QR code…</> : <><QrCode size={15} aria-hidden="true" /> Link WhatsApp</>}
      </button>
    </div>
  );
}
