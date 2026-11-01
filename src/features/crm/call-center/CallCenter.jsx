import React, { useEffect, useMemo, useRef, useState } from 'react';
import { format, formatDistanceToNowStrict, isToday } from 'date-fns';
import {
  Phone, PhoneOff, PhoneIncoming, PhoneOutgoing, PhoneMissed, Delete, Mic, MicOff, Pause, Play, Grid3x3, Disc, Volume2,
  Search, Clock, Users, PhoneCall, Timer, Save, BookUser, History, X,
} from 'lucide-react';
import PageHeader from '../../../components/ui/PageHeader';
import { useToast } from '../../../components/ui/Toast';
import useLocalStorage from '../../../hooks/useLocalStorage';
import useCollection from '../../../hooks/useCollection';
import { useSettings } from '../../../lib/settings';
import { initialCallLog, CALL_DISPOSITIONS } from '../../../data/operationsData';
import { generateId } from '../../../utils/format';
import { MemberAvatar, Pill, MiniStat, Segmented } from '../../team/teamUi';

const KEYS = [['1', ''], ['2', 'ABC'], ['3', 'DEF'], ['4', 'GHI'], ['5', 'JKL'], ['6', 'MNO'], ['7', 'PQRS'], ['8', 'TUV'], ['9', 'WXYZ'], ['*', ''], ['0', '+'], ['#', '']];
const COUNTRIES = [['+92', '🇵🇰'], ['+971', '🇦🇪'], ['+966', '🇸🇦'], ['+44', '🇬🇧'], ['+1', '🇺🇸']];
const digitsOf = (s) => String(s).replace(/\D/g, '');
const mmss = (sec) => `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`;
const DIR = {
  Outgoing: { icon: PhoneOutgoing, cls: 'text-brand bg-primary-100' },
  Incoming: { icon: PhoneIncoming, cls: 'text-success-600 bg-success-50' },
  Missed: { icon: PhoneMissed, cls: 'text-danger-600 bg-danger-50' },
};
const DISPO_TONE = { Interested: 'success', 'Meeting booked': 'primary', 'Follow-up needed': 'warning', 'Not interested': 'neutral', 'No answer': 'danger', 'Wrong number': 'neutral' };

export default function CallCenter() {
  const addToast = useToast();
  const [{ profile }] = useSettings();
  const [log, setLog] = useLocalStorage('meridian-call-log', initialCallLog);
  const [contacts] = useCollection('contacts');
  const [, setComms] = useCollection('communications');

  const [country, setCountry] = useState('+92');
  const [number, setNumber] = useState('');
  const [phase, setPhase] = useState('idle'); // idle | ringing | incoming | connected | wrapup
  const [call, setCall] = useState(null); // { name, number, direction }
  const [seconds, setSeconds] = useState(0);
  const [muted, setMuted] = useState(false);
  const [held, setHeld] = useState(false);
  const [recording, setRecording] = useState(false);
  const [speaker, setSpeaker] = useState(false);
  const [showPad, setShowPad] = useState(false);
  const [wrap, setWrap] = useState({ disposition: 'Interested', notes: '', logToCrm: true });
  const [tab, setTab] = useState('recent');
  const [query, setQuery] = useState('');
  const timer = useRef(null);
  const ringTimer = useRef(null);

  useEffect(() => () => { clearInterval(timer.current); clearTimeout(ringTimer.current); }, []);
  useEffect(() => {
    clearInterval(timer.current);
    if (phase === 'connected' && !held) timer.current = setInterval(() => setSeconds(s => s + 1), 1000);
    return () => clearInterval(timer.current);
  }, [phase, held]);

  const directory = useMemo(() => contacts.filter(c => c.phone).map(c => ({ name: c.name, company: c.company, phone: c.phone })), [contacts]);
  const lookup = (num) => {
    const d = digitsOf(num).slice(-9);
    if (d.length < 7) return null;
    return directory.find(c => digitsOf(c.phone).endsWith(d)) || log.find(l => l.name && digitsOf(l.number).endsWith(d)) || null;
  };

  const fullNumber = number.startsWith('+') ? number : `${country} ${number}`.trim();
  const match = lookup(fullNumber);

  const press = (k) => {
    if (phase === 'connected') { addToast(`Sent tone ${k}`, 'info', 1200); return; }
    setNumber(n => (n + k).slice(0, 18));
  };

  const startCall = (num = fullNumber, name) => {
    if (digitsOf(num).length < 7) { addToast('Enter a valid phone number — at least 7 digits.', 'error'); return; }
    const who = name || lookup(num)?.name || '';
    setCall({ name: who, number: num, direction: 'Outgoing' });
    setSeconds(0);
    setMuted(false); setHeld(false); setRecording(false); setSpeaker(false); setShowPad(false);
    setPhase('ringing');
    clearTimeout(ringTimer.current);
    ringTimer.current = setTimeout(() => setPhase('connected'), 2600);
  };

  const simulateIncoming = () => {
    const pick = directory[Math.floor(Math.random() * Math.max(1, directory.length))] || { name: '', phone: '+92 333 1234567' };
    setCall({ name: pick.name, company: pick.company, number: pick.phone, direction: 'Incoming' });
    setSeconds(0);
    setPhase('incoming');
  };

  const hangUp = () => {
    clearTimeout(ringTimer.current);
    if (phase === 'ringing' || phase === 'incoming') {
      const missed = phase === 'incoming';
      setLog(prev => [{ id: `call-${generateId()}`, name: call.name, number: call.number, direction: missed ? 'Missed' : 'Outgoing', at: new Date().toISOString(), seconds: 0, disposition: 'No answer', notes: '', agent: profile.name }, ...prev]);
      setPhase('idle');
      addToast(missed ? 'Call declined.' : 'Call cancelled.', 'info');
      return;
    }
    setWrap({ disposition: 'Interested', notes: '', logToCrm: true });
    setPhase('wrapup');
  };

  const saveWrap = (skip) => {
    const entry = {
      id: `call-${generateId()}`, name: call.name, number: call.number, direction: call.direction, at: new Date().toISOString(),
      seconds, disposition: skip ? 'Follow-up needed' : wrap.disposition, notes: skip ? '' : wrap.notes.trim(), agent: profile.name,
    };
    setLog(prev => [entry, ...prev]);
    if (!skip && wrap.logToCrm) {
      setComms(prev => [{
        id: `comm-${generateId()}`, type: 'Call', direction: call.direction === 'Incoming' ? 'Inbound' : 'Outbound', contact: call.name || call.number,
        company: call.company || lookup(call.number)?.company || '', subject: `${wrap.disposition} — call ${call.direction === 'Incoming' ? 'from' : 'to'} ${call.number}`,
        dateTime: format(new Date(), 'yyyy-MM-dd hh:mm a'), duration: `${Math.floor(seconds / 60)}m ${String(seconds % 60).padStart(2, '0')}s`,
        owner: profile.name, status: 'Completed', notes: wrap.notes.trim(),
      }, ...prev]);
    }
    setPhase('idle');
    setNumber('');
    addToast(skip ? 'Call saved to the log.' : `Call saved${wrap.logToCrm ? ' and logged in Calls & Emails' : ''}.`, 'success');
  };

  // Keyboard dialing while idle.
  useEffect(() => {
    const onKey = (e) => {
      if (phase !== 'idle' || e.target.closest('input, textarea, select')) return;
      if (/^[0-9*#+]$/.test(e.key)) press(e.key);
      else if (e.key === 'Backspace') setNumber(n => n.slice(0, -1));
      else if (e.key === 'Enter' && number) startCall();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const todays = log.filter(l => isToday(new Date(l.at)));
  const talk = todays.reduce((s, l) => s + l.seconds, 0);
  const missedCount = todays.filter(l => l.direction === 'Missed').length;
  const connected = todays.filter(l => l.seconds > 0).length;

  const q = query.trim().toLowerCase();
  const recent = log.filter(l => !q || `${l.name} ${l.number} ${l.disposition}`.toLowerCase().includes(q));
  const people = directory.filter(c => !q || `${c.name} ${c.company} ${c.phone}`.toLowerCase().includes(q));

  const inCall = phase === 'ringing' || phase === 'connected' || phase === 'incoming';

  const CtrlBtn = ({ on, onClick, icon: Icon, offIcon: OffIcon, label }) => (
    <button type="button" onClick={onClick} aria-pressed={!!on} className="flex flex-col items-center gap-1.5 group">
      <span className={`w-14 h-14 rounded-full grid place-items-center transition-all ${on ? 'bg-primrose text-primary-ink shadow-glow-primary' : 'bg-white/10 text-white group-hover:bg-white/20'}`}>
        {on && OffIcon ? <OffIcon size={20} /> : <Icon size={20} />}
      </span>
      <span className="text-[11px] text-white/70">{label}</span>
    </button>
  );

  return (
    <div>
      <PageHeader
        title="Call Center"
        subtitle="Call any number — saved contact or not — straight from the CRM, with live call controls, wrap-up notes and a full call log."
        actions={<button type="button" className="btn-primary" onClick={simulateIncoming} disabled={phase !== 'idle'}><PhoneIncoming size={16} /> Simulate incoming call</button>}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MiniStat icon={PhoneCall} label="Calls today" value={todays.length} hint={`${connected} connected`} tone="teal" />
        <MiniStat icon={Timer} label="Talk time" value={mmss(talk)} hint="Minutes on calls today" tone="bright" />
        <MiniStat icon={PhoneMissed} label="Missed" value={missedCount} hint="Call them back" tone="red" />
        <MiniStat icon={Users} label="Connect rate" value={`${todays.length ? Math.round((connected / todays.length) * 100) : 0}%`} tone="primrose" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[400px_minmax(0,1fr)] gap-6 items-start">
        {/* Softphone */}
        <section className="relative overflow-hidden rounded-[28px] p-6 text-white shadow-xl xl:sticky xl:top-4" style={{ background: 'var(--gradient-hero)' }} aria-label="Phone">
          <span className="absolute -right-20 -top-24 w-72 h-72 rounded-full bg-primrose/10 blur-3xl" aria-hidden="true" />

          {phase === 'idle' && (
            <div className="relative">
              <div className="flex items-center gap-2 mb-4">
                <select value={country} onChange={e => setCountry(e.target.value)} className="rounded-lg bg-white/10 text-sm font-semibold px-2 py-2 outline-none [&>option]:text-gray-900" aria-label="Country code">
                  {COUNTRIES.map(([c, f]) => <option key={c} value={c}>{f} {c}</option>)}
                </select>
                <input
                  value={number}
                  onChange={e => setNumber(e.target.value.replace(/[^\d+*#\s-]/g, ''))}
                  onKeyDown={e => { if (e.key === 'Enter') startCall(); }}
                  placeholder="Enter any number"
                  className="flex-1 min-w-0 bg-transparent text-2xl font-bold tracking-wide outline-none placeholder:text-white/30 text-right tabular-nums"
                  aria-label="Phone number"
                />
                {number && <button type="button" onClick={() => setNumber(n => n.slice(0, -1))} className="p-2 rounded-lg hover:bg-white/10" aria-label="Delete digit"><Delete size={20} /></button>}
              </div>
              <p className="text-center text-sm h-5 mb-4 text-primrose">{match ? `${match.name}${match.company ? ` · ${match.company}` : ''}` : number ? 'New number — not in contacts' : ''}</p>
              <div className="grid grid-cols-3 gap-3 sm:gap-4 justify-items-center">
                {KEYS.map(([k, sub]) => (
                  <button key={k} type="button" onClick={() => press(k)} className="w-[72px] h-[72px] rounded-full bg-white/10 hover:bg-white/20 active:scale-95 transition-all grid place-items-center">
                    <span className="leading-none text-center">
                      <span className="block text-2xl font-semibold">{k}</span>
                      <span className="block text-[9px] tracking-[0.2em] text-white/50 h-3">{sub}</span>
                    </span>
                  </button>
                ))}
              </div>
              <div className="flex justify-center mt-6">
                <button type="button" onClick={() => startCall()} disabled={digitsOf(number).length < 4} className="w-[72px] h-[72px] rounded-full bg-success-500 hover:bg-success-400 disabled:opacity-40 grid place-items-center shadow-lg transition-transform hover:scale-105" aria-label="Call">
                  <Phone size={28} />
                </button>
              </div>
            </div>
          )}

          {inCall && call && (
            <div className="relative text-center py-2">
              <div className="relative w-28 h-28 mx-auto mb-5">
                {phase !== 'connected' && (
                  <>
                    <span className="absolute inset-0 rounded-full bg-primrose/30 animate-ping" />
                    <span className="absolute -inset-3 rounded-full border border-primrose/30 animate-pulse" />
                  </>
                )}
                <span className="relative w-28 h-28 rounded-full grid place-items-center bg-primrose text-primary-ink text-3xl font-extrabold shadow-glow-primary">
                  {call.name ? call.name.split(' ').map(p => p[0]).slice(0, 2).join('') : <Phone size={36} />}
                </span>
              </div>
              <p className="text-xl font-bold">{call.name || 'Unknown caller'}</p>
              <p className="text-white/70 text-sm tabular-nums">{call.number}</p>
              <p className="mt-3 text-sm font-semibold text-primrose">
                {phase === 'ringing' && 'Calling…'}
                {phase === 'incoming' && 'Incoming call…'}
                {phase === 'connected' && <span className="inline-flex items-center gap-2"><span className={`w-2 h-2 rounded-full ${held ? 'bg-accent' : 'bg-success-400 animate-pulse'}`} />{held ? 'On hold' : 'Connected'} · <span className="tabular-nums">{mmss(seconds)}</span>{recording && <span className="text-danger-300">● REC</span>}</span>}
              </p>

              {phase === 'connected' && !showPad && (
                <div className="grid grid-cols-3 gap-y-5 mt-8">
                  <CtrlBtn on={muted} onClick={() => setMuted(m => !m)} icon={Mic} offIcon={MicOff} label={muted ? 'Unmute' : 'Mute'} />
                  <CtrlBtn on={held} onClick={() => setHeld(h => !h)} icon={Pause} offIcon={Play} label={held ? 'Resume' : 'Hold'} />
                  <CtrlBtn on={showPad} onClick={() => setShowPad(true)} icon={Grid3x3} label="Keypad" />
                  <CtrlBtn on={recording} onClick={() => { setRecording(r => !r); addToast(recording ? 'Recording stopped.' : 'Recording started (demo).', 'info'); }} icon={Disc} label="Record" />
                  <CtrlBtn on={speaker} onClick={() => setSpeaker(s => !s)} icon={Volume2} label="Speaker" />
                  <CtrlBtn onClick={() => addToast('Call transfer needs the telephony integration.', 'info')} icon={Users} label="Transfer" />
                </div>
              )}
              {phase === 'connected' && showPad && (
                <div className="mt-6">
                  <div className="grid grid-cols-3 gap-3 justify-items-center">
                    {KEYS.map(([k]) => (
                      <button key={k} type="button" onClick={() => press(k)} className="w-14 h-14 rounded-full bg-white/10 hover:bg-white/20 text-xl font-semibold">{k}</button>
                    ))}
                  </div>
                  <button type="button" onClick={() => setShowPad(false)} className="mt-3 text-xs text-white/70 hover:text-white inline-flex items-center gap-1"><X size={12} /> Hide keypad</button>
                </div>
              )}

              <div className="flex justify-center gap-8 mt-8">
                {phase === 'incoming' && (
                  <button type="button" onClick={() => setPhase('connected')} className="w-[72px] h-[72px] rounded-full bg-success-500 hover:bg-success-400 grid place-items-center shadow-lg animate-bounce" aria-label="Answer"><Phone size={28} /></button>
                )}
                <button type="button" onClick={hangUp} className="w-[72px] h-[72px] rounded-full bg-danger-500 hover:bg-danger-400 grid place-items-center shadow-lg transition-transform hover:scale-105" aria-label={phase === 'incoming' ? 'Decline' : 'Hang up'}>
                  <PhoneOff size={28} />
                </button>
              </div>
            </div>
          )}

          {phase === 'wrapup' && call && (
            <div className="relative">
              <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-primrose">Call ended · {mmss(seconds)}</p>
              <p className="text-xl font-bold mt-1">{call.name || call.number}</p>
              <p className="text-sm text-white/60 mb-5">{call.direction} call</p>
              <p className="text-xs font-semibold text-white/80 mb-2">Outcome</p>
              <div className="flex flex-wrap gap-2 mb-4">
                {CALL_DISPOSITIONS.map(d => (
                  <button key={d} type="button" onClick={() => setWrap(w => ({ ...w, disposition: d }))} className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${wrap.disposition === d ? 'bg-primrose text-primary-ink' : 'bg-white/10 hover:bg-white/20'}`}>{d}</button>
                ))}
              </div>
              <label htmlFor="wrap-notes" className="text-xs font-semibold text-white/80">Notes</label>
              <textarea id="wrap-notes" rows={4} value={wrap.notes} onChange={e => setWrap(w => ({ ...w, notes: e.target.value }))} className="mt-1.5 w-full rounded-xl bg-white/95 p-3 text-sm outline-none focus:ring-4 focus:ring-primrose/40" style={{ color: '#102C32' }} placeholder="What was discussed? Next steps?" />
              <label className="flex items-center gap-2 mt-3 text-sm text-white/80 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 accent-[#F2E6A2]" checked={wrap.logToCrm} onChange={e => setWrap(w => ({ ...w, logToCrm: e.target.checked }))} /> Also log in CRM → Calls &amp; Emails
              </label>
              <div className="flex gap-2 mt-5">
                <button type="button" onClick={() => saveWrap(false)} className="btn-primary flex-1"><Save size={15} /> Save call</button>
                <button type="button" onClick={() => saveWrap(true)} className="btn !bg-white/10 hover:!bg-white/20 text-white">Skip</button>
              </div>
            </div>
          )}
        </section>

        {/* Log + contacts */}
        <section className="card overflow-hidden min-w-0">
          <div className="card-header flex-wrap gap-3">
            <Segmented
              label="Call lists"
              value={tab}
              onChange={setTab}
              options={[{ value: 'recent', label: 'Recent calls', icon: History, count: log.length }, { value: 'contacts', label: 'Contacts', icon: BookUser, count: directory.length }]}
            />
            <div className="relative w-full sm:w-64">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input type="search" className="form-input !pl-9" placeholder={tab === 'recent' ? 'Search calls…' : 'Search contacts…'} value={query} onChange={e => setQuery(e.target.value)} aria-label="Search" />
            </div>
          </div>

          {tab === 'recent' && (
            <ul className="divide-y divide-[color:var(--border-subtle)]">
              {recent.length === 0 && <li className="py-12 text-center text-sm text-gray-500">No calls found.</li>}
              {recent.map(l => {
                const D = DIR[l.direction] || DIR.Outgoing;
                return (
                  <li key={l.id} className="px-5 py-3.5 flex items-center gap-4 hover:bg-gray-50 transition-colors group">
                    <span className={`w-10 h-10 rounded-full grid place-items-center shrink-0 ${D.cls}`}><D.icon size={17} /></span>
                    <div className="min-w-0 flex-1">
                      <p className={`text-sm font-semibold truncate ${l.direction === 'Missed' ? 'text-danger-600' : 'text-gray-900'}`}>{l.name || l.number}</p>
                      <p className="text-xs text-gray-500 truncate">{l.name ? `${l.number} · ` : ''}{l.notes || l.direction}</p>
                    </div>
                    <div className="hidden sm:block text-right shrink-0">
                      <p className="text-xs text-gray-700 font-medium flex items-center justify-end gap-1"><Clock size={11} /> {l.seconds ? mmss(l.seconds) : '—'}</p>
                      <p className="text-[11px] text-gray-500">{formatDistanceToNowStrict(new Date(l.at))} ago</p>
                    </div>
                    <Pill tone={DISPO_TONE[l.disposition] || 'neutral'} className="hidden md:inline-flex">{l.disposition}</Pill>
                    <button type="button" onClick={() => startCall(l.number, l.name)} disabled={phase !== 'idle'} className="w-9 h-9 rounded-full grid place-items-center bg-success-50 text-success-600 hover:bg-success-500 hover:text-white transition-colors disabled:opacity-40" aria-label={`Call ${l.name || l.number}`}>
                      <Phone size={15} />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          {tab === 'contacts' && (
            <ul className="divide-y divide-[color:var(--border-subtle)]">
              {people.length === 0 && <li className="py-12 text-center text-sm text-gray-500">No contacts with phone numbers.</li>}
              {people.map(c => (
                <li key={`${c.name}-${c.phone}`} className="px-5 py-3 flex items-center gap-4 hover:bg-gray-50 transition-colors">
                  <MemberAvatar name={c.name} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-900 truncate">{c.name}</p>
                    <p className="text-xs text-gray-500 truncate">{c.company} · {c.phone}</p>
                  </div>
                  <button type="button" onClick={() => startCall(c.phone, c.name)} disabled={phase !== 'idle'} className="btn-outline btn-sm disabled:opacity-40"><Phone size={14} /> Call</button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
      <p className="text-xs text-gray-500 mt-4">Demo mode: calls are simulated in the browser. Connect a telephony provider (e.g. Twilio) to place real calls.</p>
    </div>
  );
}
