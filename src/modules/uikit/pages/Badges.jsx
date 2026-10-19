import React, { useState } from 'react';
import { Star, ArrowUpRight, X, Bell, Mail, ShoppingCart, Check, Plus } from 'lucide-react';
import StatusBadge from '../../../components/ui/StatusBadge';
import { GalleryPage, Example, ExampleGrid, Caption, dedent } from '../kit/Gallery';
import { BADGE, SOLID, TEXT, BORDER, TONES, TONE_LABEL } from '../kit/tones';
import { PEOPLE, initials, AVATAR_TINTS } from '../kit/sample';

const ALL = [...TONES, 'gray'];
const SIZES = [
  { key: 'xs', cls: '!text-[10px] !px-1.5 !py-0 !leading-4' },
  { key: 'sm', cls: '' },
  { key: 'md', cls: '!text-xs !px-2.5 !py-1' },
  { key: 'lg', cls: '!text-[13px] !px-3 !py-1.5' },
];

export default function Badges() {
  const [tags, setTags] = useState(['ISO 9001', 'ISO 14001', 'ISO 45001', 'HACCP', 'ISO 27001']);
  const [draft, setDraft] = useState('');
  const [counts, setCounts] = useState({ bell: 3, mail: 12, cart: 0 });

  const addTag = (e) => {
    e.preventDefault();
    const v = draft.trim();
    if (v && !tags.includes(v)) setTags(t => [...t, v]);
    setDraft('');
  };

  return (
    <GalleryPage
      title="Badges"
      subtitle="Labels, counters and status chips. Soft badges use the .badge-* classes, which switch to lighter text in dark mode."
      classes={['.badge', '.badge-primary', '.badge-success', '.badge-warning', '.badge-danger', '.badge-info', '.badge-accent', '.badge-secondary', '.badge-dot', 'StatusBadge']}
    >
      <ExampleGrid>
        <Example
          title="Soft badges"
          description="The default design-system badge."
          code={dedent`
            <span className="badge-primary">Primary</span>
            <span className="badge-success">Success</span>
            <span className="badge-warning">Warning</span>
            <span className="badge-danger">Danger</span>
            <span className="badge-info">Info</span>
            <span className="badge-accent">Accent</span>
            <span className="badge-secondary">Neutral</span>
          `}
        >
          <Caption>Flat</Caption>
          <div className="flex flex-wrap gap-2 mb-4">{ALL.map(t => <span key={t} className={BADGE[t]}>{TONE_LABEL[t]}</span>)}</div>
          <Caption>Rounded</Caption>
          <div className="flex flex-wrap gap-2">{ALL.map(t => <span key={t} className={`${BADGE[t]} rounded-full`}>{TONE_LABEL[t]}</span>)}</div>
        </Example>

        <Example
          title="Solid and outline"
          description="Higher emphasis or a lighter touch."
          code={dedent`
            <span className="badge bg-primary-600 text-white">Primary</span>
            <span className="badge border border-primary-500 text-primary-600">Primary</span>
          `}
        >
          <Caption>Solid</Caption>
          <div className="flex flex-wrap gap-2 mb-4">{ALL.map(t => <span key={t} className={`badge ${SOLID[t]}`}>{TONE_LABEL[t]}</span>)}</div>
          <Caption>Outline</Caption>
          <div className="flex flex-wrap gap-2">{ALL.map(t => <span key={t} className={`badge border ${BORDER[t]} ${TEXT[t]}`}>{TONE_LABEL[t]}</span>)}</div>
        </Example>

        <Example
          title="Sizes"
          description="xs, sm (default), md and lg."
          code={dedent`
            <span className="badge-primary !text-[10px] !px-1.5 !py-0">xs</span>
            <span className="badge-primary">sm</span>
            <span className="badge-primary !text-xs !px-2.5 !py-1">md</span>
            <span className="badge-primary !text-[13px] !px-3 !py-1.5">lg</span>
          `}
        >
          <div className="space-y-3">
            {['primary', 'success', 'danger'].map(t => (
              <div key={t} className="flex flex-wrap items-center gap-2">
                {SIZES.map(s => <span key={s.key} className={`${BADGE[t]} ${s.cls}`}>{TONE_LABEL[t]} {s.key}</span>)}
                {SIZES.map(s => <span key={`solid-${s.key}`} className={`badge ${SOLID[t]} ${s.cls}`}>{s.key}</span>)}
              </div>
            ))}
          </div>
        </Example>

        <Example
          title="With icons and dots"
          description="Left icon, right icon and the .badge-dot indicator."
          code={dedent`
            <span className="badge-success"><Check size={12} aria-hidden="true" /> Passed</span>
            <span className="badge-info">Details <ArrowUpRight size={12} aria-hidden="true" /></span>
            <span className="badge-warning badge-dot">Pending</span>
          `}
        >
          <Caption>Left icon</Caption>
          <div className="flex flex-wrap gap-2 mb-4">{ALL.map(t => <span key={t} className={BADGE[t]}><Star size={12} aria-hidden="true" />{TONE_LABEL[t]}</span>)}</div>
          <Caption>Right icon</Caption>
          <div className="flex flex-wrap gap-2 mb-4">{ALL.map(t => <span key={t} className={`${BADGE[t]} rounded-full`}>{TONE_LABEL[t]}<ArrowUpRight size={12} aria-hidden="true" /></span>)}</div>
          <Caption>Dot</Caption>
          <div className="flex flex-wrap gap-2">{ALL.map(t => <span key={t} className={`${BADGE[t]} badge-dot`}>{TONE_LABEL[t]}</span>)}</div>
        </Example>

        <Example
          title="With images"
          description="People chips with avatar initials."
          code={dedent`
            <span className="badge-secondary rounded-full !ps-0.5">
              <span className="w-4 h-4 rounded-full grid place-items-center text-[8px] bg-primary-100 text-primary-700">AK</span>
              Ayesha Khan
            </span>
          `}
        >
          <div className="flex flex-wrap gap-2">
            {PEOPLE.slice(0, 6).map((p, i) => (
              <span key={p.name} className={`${BADGE[ALL[i % ALL.length]]} rounded-full !ps-0.5`}>
                <span className={`w-4 h-4 rounded-full grid place-items-center text-[8px] font-bold ${AVATAR_TINTS[i]}`} aria-hidden="true">{initials(p.name)}</span>
                {p.name}
              </span>
            ))}
          </div>
        </Example>

        <Example
          title="Status badges"
          description="StatusBadge maps record statuses to tones automatically."
          code={dedent`
            import StatusBadge from '../components/ui/StatusBadge';

            <StatusBadge status="Active" />
            <StatusBadge status="Pending" />
            <StatusBadge status="Overdue" />
          `}
        >
          <div className="flex flex-wrap gap-2">
            {['Active', 'Completed', 'Pending', 'In Progress', 'New', 'Qualified', 'Overdue', 'Cancelled', 'Draft', 'Archived'].map(s => <StatusBadge key={s} status={s} />)}
          </div>
        </Example>

        <Example
          title="Counters on buttons"
          description="Click to increment; counts above 99 show 99+."
          code={dedent`
            <button type="button" className="btn-icon relative" aria-label="Notifications, 3 unread">
              <Bell size={18} aria-hidden="true" />
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 grid place-items-center rounded-full bg-danger-600 text-white text-[10px] font-bold ring-2 ring-[var(--surface-raised)]">3</span>
            </button>
          `}
        >
          <div className="flex flex-wrap items-center gap-5">
            {[['bell', Bell, 'Notifications', 'bg-danger-600'], ['mail', Mail, 'Messages', 'bg-primary-600'], ['cart', ShoppingCart, 'Cart items', 'bg-info-600']].map(([k, Icon, label, bg]) => (
              <button key={k} type="button" className="btn-icon relative" aria-label={`${label}, ${counts[k]}`} onClick={() => setCounts(c => ({ ...c, [k]: c[k] + (k === 'mail' ? 45 : 1) }))}>
                <Icon size={18} aria-hidden="true" />
                {counts[k] > 0 && (
                  <span className={`absolute -top-0.5 -right-1 min-w-[18px] h-[18px] px-1 grid place-items-center rounded-full ${bg} text-white text-[10px] font-bold ring-2 ring-[var(--surface-raised)]`}>
                    {counts[k] > 99 ? '99+' : counts[k]}
                  </span>
                )}
              </button>
            ))}
            <button type="button" className="btn-outline btn-sm">
              Inbox <span className="badge-primary !py-0">{counts.mail > 99 ? '99+' : counts.mail}</span>
            </button>
            <button type="button" className="btn-ghost btn-sm" onClick={() => setCounts({ bell: 0, mail: 0, cart: 0 })}>Clear all</button>
          </div>
        </Example>

        <Example
          title="Removable tags"
          description="Type a tag and press Enter; × removes it."
          code={dedent`
            <span className="badge-primary rounded-full !pe-1">
              ISO 9001
              <button type="button" aria-label="Remove ISO 9001" onClick={() => remove('ISO 9001')}
                className="grid place-items-center w-4 h-4 rounded-full hover:bg-primary-600 hover:text-white">
                <X size={10} aria-hidden="true" />
              </button>
            </span>
          `}
        >
          <form onSubmit={addTag} className="flex gap-2 mb-3">
            <label htmlFor="badge-tag" className="sr-only">New tag</label>
            <input id="badge-tag" className="form-input" placeholder="Add a standard, e.g. ISO 22000" value={draft} onChange={e => setDraft(e.target.value)} />
            <button type="submit" className="btn-primary shrink-0" disabled={!draft.trim()}><Plus size={14} aria-hidden="true" /> Add</button>
          </form>
          <div className="flex flex-wrap gap-2" aria-live="polite">
            {tags.map((t, i) => (
              <span key={t} className={`${BADGE[ALL[i % ALL.length]]} rounded-full !pe-1 animate-fade-in`}>
                {t}
                <button type="button" aria-label={`Remove ${t}`} onClick={() => setTags(x => x.filter(y => y !== t))} className="grid place-items-center w-4 h-4 rounded-full hover:bg-gray-900/10 [[data-theme=dark]_&]:hover:bg-white/15">
                  <X size={10} aria-hidden="true" />
                </button>
              </span>
            ))}
            {!tags.length && <span className="text-xs text-gray-400">No tags.</span>}
          </div>
        </Example>
      </ExampleGrid>
    </GalleryPage>
  );
}
