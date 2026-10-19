import React, { useState } from 'react';
import { User, Building2, Camera, Plus } from 'lucide-react';
import AvatarGroup from '../../../components/ui/AvatarGroup';
import { GalleryPage, Example, ExampleGrid, Caption, dedent } from '../kit/Gallery';
import { PEOPLE, initials, AVATAR_TINTS } from '../kit/sample';
import { sceneImage } from '../kit/images';

const SIZES = [
  { key: 'xs', cls: 'w-6 h-6 text-[9px]', icon: 12, dot: 'w-1.5 h-1.5' },
  { key: 'sm', cls: 'w-8 h-8 text-[11px]', icon: 14, dot: 'w-2 h-2' },
  { key: 'md', cls: 'w-10 h-10 text-[13px]', icon: 17, dot: 'w-2.5 h-2.5' },
  { key: 'lg', cls: 'w-12 h-12 text-[15px]', icon: 20, dot: 'w-3 h-3' },
  { key: 'xl', cls: 'w-16 h-16 text-lg', icon: 26, dot: 'w-3.5 h-3.5' },
  { key: '2xl', cls: 'w-20 h-20 text-xl', icon: 32, dot: 'w-4 h-4' },
];
const STATUS = { online: 'bg-success-500', away: 'bg-warning-500', busy: 'bg-danger-500', offline: 'bg-gray-400' };

function Avatar({ name, size = 'md', shape = 'circle', tint = 0, src, icon: Icon, status }) {
  const s = SIZES.find(x => x.key === size);
  const radius = shape === 'circle' ? 'rounded-full' : 'rounded-md';
  return (
    <span className={`relative inline-grid place-items-center shrink-0 font-bold ${s.cls} ${radius} ${src ? '' : AVATAR_TINTS[tint % AVATAR_TINTS.length]}`} title={name}>
      {src ? <img src={src} alt={name} className={`w-full h-full object-cover ${radius}`} /> : Icon ? <Icon size={s.icon} aria-hidden="true" /> : <span aria-hidden="true">{initials(name)}</span>}
      {!src && <span className="sr-only">{name}</span>}
      {status && (
        <span className={`absolute ${shape === 'circle' ? 'bottom-0 right-0' : '-bottom-0.5 -right-0.5'} ${s.dot} rounded-full ring-2 ring-[var(--surface-raised)] ${STATUS[status]}`}>
          <span className="sr-only">{status}</span>
        </span>
      )}
    </span>
  );
}

export default function AvatarPage() {
  const [team, setTeam] = useState(PEOPLE.slice(0, 7).map(p => p.name));
  const [max, setMax] = useState(4);
  const [status, setStatus] = useState('online');
  const extra = PEOPLE.filter(p => !team.includes(p.name));

  return (
    <GalleryPage
      title="Avatar"
      subtitle="Initials, icon and image avatars in six sizes, circular or square, with presence dots and stacked groups."
      classes={['rounded-full', 'rounded-md', 'ring-2', 'AvatarGroup', '-space-x-2']}
    >
      <ExampleGrid>
        <Example
          title="Circular avatars with initials"
          description="xs → 2xl. Tints come from theme tokens."
          code={dedent`
            <span className="inline-grid place-items-center w-10 h-10 rounded-full bg-primary-100 text-primary-700 text-[13px] font-bold" title="Ayesha Khan">
              <span aria-hidden="true">AK</span>
              <span className="sr-only">Ayesha Khan</span>
            </span>
          `}
        >
          <div className="flex flex-wrap items-end gap-3">
            {SIZES.map((s, i) => <Avatar key={s.key} size={s.key} name={PEOPLE[i].name} tint={i} />)}
          </div>
        </Example>

        <Example
          title="Square avatars with initials"
          description="Use rounded-md for organisations and teams."
          code={dedent`
            <span className="inline-grid place-items-center w-12 h-12 rounded-md bg-info-100 text-info-700 text-[15px] font-bold">BA</span>
          `}
        >
          <div className="flex flex-wrap items-end gap-3">
            {SIZES.map((s, i) => <Avatar key={s.key} size={s.key} shape="square" name={PEOPLE[i + 4].name} tint={i + 1} />)}
          </div>
        </Example>

        <Example
          title="Placeholder icons"
          description="When there is no name or photo yet."
          code={dedent`
            <span className="inline-grid place-items-center w-10 h-10 rounded-full bg-gray-100 text-gray-500">
              <User size={17} aria-hidden="true" />
            </span>
          `}
        >
          <Caption>Circular</Caption>
          <div className="flex flex-wrap items-end gap-3 mb-4">
            {SIZES.map((s, i) => <Avatar key={s.key} size={s.key} name="Unknown user" icon={User} tint={i} />)}
          </div>
          <Caption>Square</Caption>
          <div className="flex flex-wrap items-end gap-3">
            {SIZES.map((s, i) => <Avatar key={s.key} size={s.key} shape="square" name="Organisation" icon={Building2} tint={i + 2} />)}
          </div>
        </Example>

        <Example
          title="Image avatars"
          description="object-cover keeps any photo square; alt text names the person."
          code={dedent`
            <span className="inline-grid w-12 h-12 rounded-full overflow-hidden">
              <img src={photoUrl} alt="Sana Malik" className="w-full h-full object-cover" />
            </span>
          `}
        >
          <div className="flex flex-wrap items-end gap-3">
            {SIZES.map((s, i) => <Avatar key={s.key} size={s.key} name={PEOPLE[i].name} src={sceneImage(i, 120, 120)} shape={i % 2 ? 'square' : 'circle'} />)}
          </div>
        </Example>

        <Example
          title="Presence dots"
          description="Pick a status to update every avatar."
          code={dedent`
            <span className="relative inline-grid place-items-center w-12 h-12 rounded-full bg-primary-100 text-primary-700 font-bold">
              AK
              <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full ring-2 ring-[var(--surface-raised)] bg-success-500">
                <span className="sr-only">online</span>
              </span>
            </span>
          `}
        >
          <fieldset className="flex flex-wrap gap-2 mb-4">
            <legend className="sr-only">Presence status</legend>
            {Object.keys(STATUS).map(k => (
              <label key={k} className={`btn-sm cursor-pointer capitalize ${status === k ? 'btn-primary' : 'btn-outline'}`}>
                <input type="radio" name="presence" value={k} checked={status === k} onChange={() => setStatus(k)} className="sr-only" />
                {k}
              </label>
            ))}
          </fieldset>
          <div className="flex flex-wrap items-end gap-3">
            {SIZES.map((s, i) => <Avatar key={s.key} size={s.key} name={PEOPLE[i].name} tint={i} status={status} shape={i > 3 ? 'square' : 'circle'} />)}
          </div>
        </Example>

        <Example
          title="Avatar group"
          description="The shared AvatarGroup component. Add people and change the visible limit."
          code={dedent`
            import AvatarGroup from '../components/ui/AvatarGroup';

            <AvatarGroup names={['Ayesha Khan', 'Bilal Ahmed', 'Sana Malik', 'Usman Tariq']} max={3} size="md" />
          `}
        >
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-6">
              <AvatarGroup names={team} max={max} size="xs" />
              <AvatarGroup names={team} max={max} size="sm" />
              <AvatarGroup names={team} max={max} size="md" />
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <label htmlFor="avatar-max" className="text-xs font-semibold text-gray-700">Show</label>
              <input id="avatar-max" type="range" min={1} max={Math.max(1, team.length)} value={max} onChange={e => setMax(Number(e.target.value))} className="accent-[#187f65] w-32" />
              <span className="text-xs text-gray-500 tabular-nums">{max} of {team.length}</span>
              <button type="button" className="btn-outline btn-sm" disabled={!extra.length} onClick={() => setTeam(t => [...t, extra[0].name])}>
                <Plus size={14} aria-hidden="true" /> Add member
              </button>
              <button type="button" className="btn-ghost btn-sm" disabled={team.length <= 1} onClick={() => setTeam(t => t.slice(0, -1))}>Remove</button>
            </div>
            <div className="flex -space-x-2">
              {team.slice(0, max).map((n, i) => (
                <span key={n} className="rounded-full ring-2 ring-[var(--surface-raised)] transition-transform hover:-translate-y-1 hover:z-10"><Avatar name={n} tint={i} size="md" /></span>
              ))}
              {team.length > max && <span className="rounded-full ring-2 ring-[var(--surface-raised)] inline-grid place-items-center w-10 h-10 bg-gray-100 text-gray-600 text-xs font-bold">+{team.length - max}</span>}
            </div>
          </div>
        </Example>

        <Example
          title="Profile with upload"
          description="Pick an image from your device; it is previewed locally and never uploaded."
          code={dedent`
            const [src, setSrc] = useState(null);
            <label htmlFor="avatar-file" className="relative cursor-pointer">
              {src ? <img src={src} alt="Your photo" className="w-20 h-20 rounded-full object-cover" /> : <span className="…">AK</span>}
              <span className="absolute bottom-0 right-0 grid place-items-center w-7 h-7 rounded-full bg-primary-600 text-white ring-2 ring-[var(--surface-raised)]">
                <Camera size={13} aria-hidden="true" />
              </span>
            </label>
            <input id="avatar-file" type="file" accept="image/*" className="sr-only"
              onChange={e => e.target.files[0] && setSrc(URL.createObjectURL(e.target.files[0]))} />
          `}
        >
          <AvatarUpload />
        </Example>
      </ExampleGrid>
    </GalleryPage>
  );
}

function AvatarUpload() {
  const [src, setSrc] = useState(null);
  return (
    <div className="flex items-center gap-4 flex-wrap">
      <label htmlFor="avatar-file" className="relative cursor-pointer group">
        {src
          ? <img src={src} alt="Selected profile" className="w-20 h-20 rounded-full object-cover" />
          : <span className={`inline-grid place-items-center w-20 h-20 rounded-full text-xl font-bold ${AVATAR_TINTS[0]}`}>AK</span>}
        <span className="absolute bottom-0 right-0 grid place-items-center w-7 h-7 rounded-full bg-primary-600 text-white ring-2 ring-[var(--surface-raised)] transition-transform group-hover:scale-110">
          <Camera size={13} aria-hidden="true" />
        </span>
        <span className="sr-only">Choose a profile photo</span>
      </label>
      <input id="avatar-file" type="file" accept="image/*" className="sr-only" onChange={e => {
        const f = e.target.files?.[0];
        if (f) setSrc(old => { if (old) URL.revokeObjectURL(old); return URL.createObjectURL(f); });
      }} />
      <div>
        <p className="text-sm font-bold text-gray-900">Ayesha Khan</p>
        <p className="text-xs text-gray-500">Quality Lead · Lahore</p>
        {src && <button type="button" className="btn-ghost btn-xs mt-1 !px-0 text-danger-600" onClick={() => { URL.revokeObjectURL(src); setSrc(null); }}>Remove photo</button>}
      </div>
    </div>
  );
}
