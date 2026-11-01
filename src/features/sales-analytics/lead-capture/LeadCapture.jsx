import React, { useEffect, useMemo, useRef, useState } from 'react';
import { format, formatDistanceToNowStrict, subDays } from 'date-fns';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts';
import {
  Facebook, Linkedin, RefreshCw, UserPlus, Trash2, Zap, Inbox, CheckCircle2, Percent, Radio, Mail, Phone, Link2, Unlink,
} from 'lucide-react';
import PageHeader from '../../../components/ui/PageHeader';
import { useToast } from '../../../components/ui/Toast';
import useLocalStorage from '../../../hooks/useLocalStorage';
import useCollection from '../../../hooks/useCollection';
import { useSettings } from '../../../lib/settings';
import { CHART, TOOLTIP_STYLE } from '../../../lib/chartColors';
import { initialCapturedLeads, LEAD_PLATFORMS, SIMULATED_LEADS } from '../../../data/operationsData';
import { generateId } from '../../../utils/format';
import { MemberAvatar, Pill, MiniStat, Segmented } from '../../team/teamUi';

const ICONS = { Facebook, LinkedIn: Linkedin };
const STATUS_TONE = { New: 'warning', 'Added to CRM': 'success', Discarded: 'neutral' };
const LIVE_EVERY_MS = 20000;

function makeLead(platform) {
  const [name, company, jobTitle] = SIMULATED_LEADS[Math.floor(Math.random() * SIMULATED_LEADS.length)];
  const forms = LEAD_PLATFORMS[platform].forms;
  const n = Math.floor(Math.random() * 9000000) + 1000000;
  return {
    id: `cl-${generateId()}`, platform, form: forms[Math.floor(Math.random() * forms.length)], name, company, jobTitle,
    email: `${name.split(' ')[0].toLowerCase()}@${company.split(' ')[0].toLowerCase()}.com`, phone: `+92 3${n % 5}${n % 10} ${n}`,
    capturedAt: new Date().toISOString(), status: 'New', fresh: true,
  };
}

export default function LeadCapture() {
  const addToast = useToast();
  const [{ profile }] = useSettings();
  const [captured, setCaptured] = useLocalStorage('meridian-captured-leads', initialCapturedLeads);
  const [connections, setConnections] = useLocalStorage('meridian-lead-sources', { Facebook: true, LinkedIn: true });
  const [, setLeads] = useCollection('leads');
  const [syncing, setSyncing] = useState(null);
  const [live, setLive] = useState(false);
  const [filter, setFilter] = useState('all');
  const [selected, setSelected] = useState(() => new Set());
  const [lastSync, setLastSync] = useState(() => ({ Facebook: new Date(), LinkedIn: new Date() }));
  const conn = useRef(connections);
  conn.current = connections;

  const receive = (platform, count = 1) => {
    const fresh = Array.from({ length: count }, () => makeLead(platform));
    setCaptured(prev => [...fresh, ...prev]);
    setLastSync(s => ({ ...s, [platform]: new Date() }));
    return fresh;
  };

  const sync = (platform) => {
    if (!connections[platform]) return;
    setSyncing(platform);
    setTimeout(() => {
      const fresh = receive(platform, 1 + Math.floor(Math.random() * 2));
      setSyncing(null);
      addToast(`${fresh.length} new ${platform} lead${fresh.length > 1 ? 's' : ''} captured.`, 'success');
    }, 1300);
  };

  // Demo "live capture": a new lead arrives every few seconds from a connected source.
  useEffect(() => {
    if (!live) return undefined;
    const t = setInterval(() => {
      const on = Object.keys(LEAD_PLATFORMS).filter(p => conn.current[p]);
      if (!on.length) return;
      const p = on[Math.floor(Math.random() * on.length)];
      const [lead] = receive(p);
      addToast(`⚡ New ${p} lead: ${lead.name} (${lead.company})`, 'info');
    }, LIVE_EVERY_MS);
    return () => clearInterval(t);
  }, [live]); // eslint-disable-line react-hooks/exhaustive-deps

  // The "NEW" highlight fades after a few seconds.
  useEffect(() => {
    if (!captured.some(c => c.fresh)) return undefined;
    const t = setTimeout(() => setCaptured(prev => prev.map(c => (c.fresh ? { ...c, fresh: false } : c))), 8000);
    return () => clearTimeout(t);
  }, [captured, setCaptured]);

  const toggleConnection = (platform) => {
    const next = !connections[platform];
    setConnections(c => ({ ...c, [platform]: next }));
    addToast(next ? `${platform} connected. New form submissions will appear here.` : `${platform} disconnected.`, next ? 'success' : 'info');
  };

  const addToCrm = (ids) => {
    const list = captured.filter(c => ids.has(c.id) && c.status === 'New');
    if (!list.length) return;
    const today = format(new Date(), 'yyyy-MM-dd');
    setLeads(prev => [
      ...list.map(c => ({
        id: `lead-${generateId()}`, contactName: c.name, company: c.company, email: c.email, phone: c.phone, source: c.platform,
        status: 'New', assignedTo: profile.name, dealValue: 0, lastContact: today, notes: `${c.jobTitle} · captured from ${c.platform} form “${c.form}”`,
      })),
      ...prev,
    ]);
    setCaptured(prev => prev.map(c => (ids.has(c.id) && c.status === 'New' ? { ...c, status: 'Added to CRM', fresh: false } : c)));
    setSelected(new Set());
    addToast(`${list.length} lead${list.length > 1 ? 's' : ''} added to Website Analytics → Leads.`, 'success');
  };

  const discard = (id) => {
    setCaptured(prev => prev.map(c => (c.id === id ? { ...c, status: 'Discarded', fresh: false } : c)));
    addToast('Lead discarded.', 'info');
  };

  const visible = captured.filter(c => (filter === 'all' ? true : filter === 'new' ? c.status === 'New' : c.platform === filter));
  const weekAgo = subDays(new Date(), 7);
  const week = captured.filter(c => new Date(c.capturedAt) >= weekAgo);
  const added = captured.filter(c => c.status === 'Added to CRM').length;

  const chartData = useMemo(() => Array.from({ length: 7 }, (_, i) => {
    const d = subDays(new Date(), 6 - i);
    const key = format(d, 'yyyy-MM-dd');
    const base = (i * 3) % 4;
    const count = (p) => captured.filter(c => c.platform === p && c.capturedAt.slice(0, 10) === key).length;
    // Seeded history so the chart has shape; real captures add on top.
    return { day: format(d, 'EEE'), Facebook: count('Facebook') + (i < 6 ? 2 + base : 0), LinkedIn: count('LinkedIn') + (i < 6 ? 1 + ((base + 1) % 3) : 0) };
  }), [captured]);

  const newCount = captured.filter(c => c.status === 'New').length;

  return (
    <div>
      <PageHeader
        title="Social Lead Capture"
        subtitle="Leads from Facebook Lead Ads and LinkedIn Lead Gen Forms land here instantly — review them and push them into the CRM in one click."
        actions={(
          <button type="button" onClick={() => setLive(l => !l)} className={live ? 'btn-primary' : 'btn-outline !bg-white/10 !text-white !border-white/25 hover:!bg-white/20'} aria-pressed={live}>
            <Radio size={16} className={live ? 'animate-pulse' : ''} /> {live ? 'Live capture on' : 'Start live capture'}
          </button>
        )}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
        {Object.entries(LEAD_PLATFORMS).map(([platform, cfg]) => {
          const Icon = ICONS[platform];
          const on = connections[platform];
          const count = week.filter(c => c.platform === platform).length;
          return (
            <section key={platform} className="relative overflow-hidden rounded-3xl p-6 text-white shadow-lg" style={{ background: on ? `linear-gradient(135deg, ${cfg.color}, #093F50 85%)` : 'linear-gradient(135deg, #52676A, #27434A)' }}>
              <span className="absolute -right-8 -bottom-10 opacity-10" aria-hidden="true"><Icon size={180} /></span>
              <div className="relative flex items-start gap-4">
                <span className="w-14 h-14 rounded-2xl bg-white grid place-items-center shrink-0 shadow-md" style={{ color: cfg.color }}><Icon size={28} /></span>
                <div className="flex-1 min-w-0">
                  <p className="text-lg font-bold">{platform === 'Facebook' ? 'Facebook Lead Ads' : 'LinkedIn Lead Gen Forms'}</p>
                  <p className="text-sm text-white/75 truncate">{cfg.page}</p>
                  <p className="text-xs mt-1.5 flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${on ? 'bg-success-400 animate-pulse' : 'bg-white/40'}`} />
                    {on ? `Connected · synced ${formatDistanceToNowStrict(lastSync[platform])} ago` : 'Disconnected'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-extrabold leading-none">{count}</p>
                  <p className="text-[11px] text-white/70 mt-1">leads · 7 days</p>
                </div>
              </div>
              <div className="relative flex flex-wrap gap-1.5 mt-4">
                {cfg.forms.map(f => <span key={f} className="px-2.5 py-1 rounded-full bg-white/15 text-[11px] font-semibold">{f}</span>)}
              </div>
              <div className="relative flex gap-2 mt-5">
                <button type="button" onClick={() => sync(platform)} disabled={!on || syncing === platform} className="btn !bg-white !text-teal-900 hover:!bg-primrose disabled:opacity-50">
                  <RefreshCw size={15} className={syncing === platform ? 'animate-spin' : ''} /> {syncing === platform ? 'Syncing…' : 'Sync now'}
                </button>
                <button type="button" onClick={() => toggleConnection(platform)} className="btn !bg-white/10 hover:!bg-white/20 text-white border border-white/20">
                  {on ? <><Unlink size={15} /> Disconnect</> : <><Link2 size={15} /> Connect</>}
                </button>
              </div>
            </section>
          );
        })}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MiniStat icon={Zap} label="Captured · 7 days" value={week.length} tone="teal" />
        <MiniStat icon={Inbox} label="Waiting for review" value={newCount} hint="New in the inbox" tone="orange" />
        <MiniStat icon={CheckCircle2} label="Added to CRM" value={added} tone="green" />
        <MiniStat icon={Percent} label="Conversion" value={`${captured.length ? Math.round((added / captured.length) * 100) : 0}%`} hint="Captured → CRM lead" tone="primrose" />
      </div>

      <div className="grid grid-cols-1 2xl:grid-cols-[minmax(0,1fr)_420px] gap-6">
        <section className="card overflow-hidden min-w-0">
          <div className="card-header flex-wrap gap-3">
            <Segmented
              label="Lead inbox filter"
              value={filter}
              onChange={(v) => { setFilter(v); setSelected(new Set()); }}
              options={[
                { value: 'all', label: 'All', count: captured.length },
                { value: 'new', label: 'New', count: newCount },
                { value: 'Facebook', label: 'Facebook', icon: Facebook },
                { value: 'LinkedIn', label: 'LinkedIn', icon: Linkedin },
              ]}
            />
            {selected.size > 0 && (
              <button type="button" className="btn-primary btn-sm animate-fade-in" onClick={() => addToCrm(selected)}><UserPlus size={14} /> Add {selected.size} to CRM</button>
            )}
          </div>
          <ul className="divide-y divide-[color:var(--border-subtle)]">
            {visible.length === 0 && <li className="py-12 text-center text-sm text-gray-500">No leads here yet.</li>}
            {visible.map(c => {
              const Icon = ICONS[c.platform];
              const isNew = c.status === 'New';
              return (
                <li key={c.id} className={`px-5 py-4 flex items-center gap-4 transition-colors ${c.fresh ? 'bg-primary-50 animate-slide-up' : 'hover:bg-gray-50'}`}>
                  <input
                    type="checkbox"
                    disabled={!isNew}
                    checked={selected.has(c.id)}
                    onChange={() => setSelected(prev => { const n = new Set(prev); if (n.has(c.id)) n.delete(c.id); else n.add(c.id); return n; })}
                    className="w-4 h-4 accent-[#145D68] disabled:opacity-30"
                    aria-label={`Select ${c.name}`}
                  />
                  <span className="relative">
                    <MemberAvatar name={c.name} />
                    <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full grid place-items-center text-white ring-2 ring-[color:var(--surface-raised)]" style={{ backgroundColor: LEAD_PLATFORMS[c.platform].color }}><Icon size={10} /></span>
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-900 flex items-center gap-2">{c.name}{c.fresh && <Pill tone="warning">NEW</Pill>}</p>
                    <p className="text-xs text-gray-500 truncate">{c.jobTitle} · {c.company}</p>
                    <p className="text-[11px] text-gray-500 truncate mt-0.5 flex flex-wrap gap-x-3">
                      <span className="inline-flex items-center gap-1"><Mail size={11} />{c.email}</span>
                      <span className="inline-flex items-center gap-1"><Phone size={11} />{c.phone}</span>
                    </p>
                  </div>
                  <div className="hidden lg:block text-right shrink-0 max-w-[180px]">
                    <p className="text-xs font-medium text-gray-700 truncate">{c.form}</p>
                    <p className="text-[11px] text-gray-500">{formatDistanceToNowStrict(new Date(c.capturedAt))} ago</p>
                  </div>
                  {isNew ? (
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button type="button" onClick={() => addToCrm(new Set([c.id]))} className="btn-primary btn-sm"><UserPlus size={14} /><span className="hidden sm:inline"> Add to CRM</span></button>
                      <button type="button" onClick={() => discard(c.id)} className="p-2 rounded-md text-gray-400 hover:text-danger hover:bg-danger-50" aria-label={`Discard ${c.name}`}><Trash2 size={15} /></button>
                    </div>
                  ) : (
                    <Pill tone={STATUS_TONE[c.status]} dot>{c.status}</Pill>
                  )}
                </li>
              );
            })}
          </ul>
        </section>

        <section className="card p-5">
          <h2 className="text-[15px] font-bold text-gray-900">Leads per day</h2>
          <p className="text-xs text-gray-500 mb-4">Last 7 days by source</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} barCategoryGap="28%">
                <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: CHART.axis }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: CHART.axis }} axisLine={false} tickLine={false} width={28} />
                <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: 'rgb(var(--c-gray-100))' }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="Facebook" stackId="a" fill={CHART.teal} radius={[0, 0, 4, 4]} />
                <Bar dataKey="LinkedIn" stackId="a" fill={CHART.orange} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 rounded-xl bg-primary-50 border border-[color:var(--hover-border)] p-4 text-sm text-gray-700">
            <p className="font-semibold text-gray-900 mb-1">How it works</p>
            Connect your Facebook Page and LinkedIn Company Page. Every lead-form submission is captured here with the form name, so your team can qualify and add it to the CRM pipeline in seconds.
          </div>
        </section>
      </div>
    </div>
  );
}
