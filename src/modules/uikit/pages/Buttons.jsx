import React, { useState } from 'react';
import { Plus, Download, ArrowRight, Trash2, Heart, Loader2, Settings, Share2, Bookmark, Bold, Italic, Underline, Send } from 'lucide-react';
import { GalleryPage, Example, ExampleGrid, Caption, dedent } from '../kit/Gallery';
import { SOLID, BORDER, TEXT } from '../kit/tones';

const VARIANTS = [
  ['btn-primary', 'Primary'],
  ['btn-secondary', 'Secondary'],
  ['btn-outline', 'Outline'],
  ['btn-ghost', 'Ghost'],
  ['btn-accent', 'Accent'],
  ['btn-danger', 'Danger'],
];
const TONED = ['primary', 'success', 'warning', 'danger', 'info', 'accent'];

export default function Buttons() {
  const [loading, setLoading] = useState(null);
  const [liked, setLiked] = useState(false);
  const [format, setFormat] = useState({ bold: true, italic: false, underline: false });
  const [clicks, setClicks] = useState(0);

  const simulate = (key) => {
    setLoading(key);
    setTimeout(() => setLoading(null), 1600);
  };

  return (
    <GalleryPage
      title="Buttons"
      subtitle="Every .btn-* variant in the design system with sizes, icons, loading, disabled and toggle states. Press Tab to see the focus ring."
      classes={['.btn-primary', '.btn-secondary', '.btn-outline', '.btn-ghost', '.btn-accent', '.btn-danger', '.btn-glass', '.btn-sm', '.btn-xs', '.btn-icon']}
    >
      <ExampleGrid>
        <Example
          title="Variants"
          description="Six semantic variants plus glass for dark heroes."
          code={dedent`
            <button type="button" className="btn-primary">Primary</button>
            <button type="button" className="btn-secondary">Secondary</button>
            <button type="button" className="btn-outline">Outline</button>
            <button type="button" className="btn-ghost">Ghost</button>
            <button type="button" className="btn-accent">Accent</button>
            <button type="button" className="btn-danger">Danger</button>
            <button type="button" className="btn-glass">Glass</button>
          `}
        >
          <div className="flex flex-wrap gap-2 mb-4">
            {VARIANTS.map(([c, l]) => <button key={c} type="button" className={c} onClick={() => setClicks(n => n + 1)}>{l}</button>)}
          </div>
          <div className="rounded-md hero-spruce p-4 flex flex-wrap gap-2 items-center">
            <button type="button" className="btn-glass" onClick={() => setClicks(n => n + 1)}>Glass</button>
            <button type="button" className="btn-glass btn-sm">Glass small</button>
            <span className="text-xs text-white/70">.btn-glass on hero-spruce</span>
          </div>
          <p className="text-xs text-gray-500 mt-3" aria-live="polite">Clicked {clicks} {clicks === 1 ? 'time' : 'times'}.</p>
        </Example>

        <Example
          title="Sizes"
          description=".btn-xs, .btn-sm, default and a large modifier."
          code={dedent`
            <button type="button" className="btn-primary btn-xs">Extra small</button>
            <button type="button" className="btn-primary btn-sm">Small</button>
            <button type="button" className="btn-primary">Default</button>
            <button type="button" className="btn-primary !px-5 !py-3 !text-sm">Large</button>
            <button type="button" className="btn-primary w-full">Block</button>
          `}
        >
          {['btn-primary', 'btn-outline', 'btn-secondary'].map(v => (
            <div key={v} className="flex flex-wrap items-center gap-2 mb-3">
              <button type="button" className={`${v} btn-xs`}>Extra small</button>
              <button type="button" className={`${v} btn-sm`}>Small</button>
              <button type="button" className={v}>Default</button>
              <button type="button" className={`${v} !px-5 !py-3 !text-sm`}>Large</button>
            </div>
          ))}
          <button type="button" className="btn-primary w-full">Block button</button>
        </Example>

        <Example
          title="Toned buttons"
          description="Solid, outline and soft fills for every tone."
          code={dedent`
            <button type="button" className="btn bg-success-600 text-white hover:brightness-110">Success</button>
            <button type="button" className="btn border border-success-500 text-success-600 hover:bg-success-50">Success</button>
            <button type="button" className="btn bg-success-50 text-success-600 hover:bg-success-100">Success</button>
          `}
        >
          <Caption>Solid</Caption>
          <div className="flex flex-wrap gap-2 mb-4">{TONED.map(t => <button key={t} type="button" className={`btn capitalize ${SOLID[t]} hover:brightness-110`}>{t}</button>)}</div>
          <Caption>Outline</Caption>
          <div className="flex flex-wrap gap-2 mb-4">{TONED.map(t => <button key={t} type="button" className={`btn capitalize border ${BORDER[t]} ${TEXT[t]} hover:bg-gray-50`}>{t}</button>)}</div>
          <Caption>Soft</Caption>
          <div className="flex flex-wrap gap-2">{TONED.map(t => <button key={t} type="button" className={`btn capitalize bg-${t}-50 hover:bg-${t}-100 ${TEXT[t]}`}>{t}</button>)}</div>
        </Example>

        <Example
          title="Rounded (pill) buttons"
          description="Add rounded-full to any variant."
          code={dedent`
            <button type="button" className="btn-primary rounded-full">Primary</button>
            <button type="button" className="btn-outline rounded-full">Outline</button>
          `}
        >
          <div className="flex flex-wrap gap-2">
            {VARIANTS.map(([c, l]) => <button key={c} type="button" className={`${c} rounded-full`}>{l}</button>)}
          </div>
        </Example>

        <Example
          title="With icons"
          description="Left icon, right icon and icon-only buttons (with aria-label)."
          code={dedent`
            <button type="button" className="btn-primary"><Plus size={15} aria-hidden="true" /> New audit</button>
            <button type="button" className="btn-outline">Continue <ArrowRight size={15} aria-hidden="true" /></button>
            <button type="button" className="btn-icon" aria-label="Settings"><Settings size={18} aria-hidden="true" /></button>
          `}
        >
          <div className="flex flex-wrap gap-2 mb-4">
            <button type="button" className="btn-primary"><Plus size={15} aria-hidden="true" /> New audit</button>
            <button type="button" className="btn-outline"><Download size={15} aria-hidden="true" /> Export</button>
            <button type="button" className="btn-secondary">Continue <ArrowRight size={15} aria-hidden="true" /></button>
            <button type="button" className="btn-danger"><Trash2 size={15} aria-hidden="true" /> Delete</button>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {[[Settings, 'Settings'], [Share2, 'Share'], [Bookmark, 'Bookmark']].map(([Icon, l]) => (
              <button key={l} type="button" className="btn-icon" aria-label={l} title={l}><Icon size={18} aria-hidden="true" /></button>
            ))}
            <button type="button" className="btn-primary !p-2.5 rounded-full" aria-label="Add"><Plus size={16} aria-hidden="true" /></button>
            <button type="button" className="btn-outline !p-2.5" aria-label="Download"><Download size={16} aria-hidden="true" /></button>
            <button type="button" className="btn-danger !p-2.5 rounded-full" aria-label="Delete"><Trash2 size={16} aria-hidden="true" /></button>
          </div>
        </Example>

        <Example
          title="States"
          description="Loading (click to try), disabled and toggle (aria-pressed)."
          code={dedent`
            <button type="button" className="btn-primary" disabled={saving} aria-busy={saving} onClick={save}>
              {saving && <Loader2 size={15} className="animate-spin" aria-hidden="true" />}
              {saving ? 'Saving…' : 'Save changes'}
            </button>

            <button type="button" className="btn-outline" disabled>Disabled</button>

            <button type="button" aria-pressed={liked} onClick={() => setLiked(l => !l)}
              className={liked ? 'btn-danger' : 'btn-outline'}>
              <Heart size={15} aria-hidden="true" fill={liked ? 'currentColor' : 'none'} /> {liked ? 'Liked' : 'Like'}
            </button>
          `}
        >
          <Caption>Loading</Caption>
          <div className="flex flex-wrap gap-2 mb-4">
            {[['save', 'btn-primary', 'Save changes', 'Saving…'], ['send', 'btn-outline', 'Send report', 'Sending…'], ['sub', 'btn-accent', 'Subscribe', 'Processing…']].map(([k, c, l, busy]) => (
              <button key={k} type="button" className={c} disabled={loading === k} aria-busy={loading === k} onClick={() => simulate(k)}>
                {loading === k ? <Loader2 size={15} className="animate-spin" aria-hidden="true" /> : k === 'send' ? <Send size={15} aria-hidden="true" /> : null}
                {loading === k ? busy : l}
              </button>
            ))}
          </div>
          <Caption>Disabled</Caption>
          <div className="flex flex-wrap gap-2 mb-4">
            {VARIANTS.map(([c, l]) => <button key={c} type="button" className={c} disabled>{l}</button>)}
          </div>
          <Caption>Toggle</Caption>
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" aria-pressed={liked} onClick={() => setLiked(l => !l)} className={liked ? 'btn-danger' : 'btn-outline'}>
              <Heart size={15} aria-hidden="true" fill={liked ? 'currentColor' : 'none'} /> {liked ? 'Liked' : 'Like'}
            </button>
            <div className="inline-flex gap-1" role="group" aria-label="Text formatting">
              {[['bold', Bold], ['italic', Italic], ['underline', Underline]].map(([k, Icon]) => (
                <button key={k} type="button" aria-pressed={format[k]} aria-label={k} onClick={() => setFormat(f => ({ ...f, [k]: !f[k] }))} className={`btn-sm !px-2.5 ${format[k] ? 'btn-secondary !bg-primary-50 !text-primary-700 [[data-theme=dark]_&]:!text-primary-300' : 'btn-ghost'}`}>
                  <Icon size={15} aria-hidden="true" />
                </button>
              ))}
            </div>
            <span className={`text-sm text-gray-700 ${format.bold ? 'font-bold' : ''} ${format.italic ? 'italic' : ''} ${format.underline ? 'underline' : ''}`}>Preview text</span>
          </div>
        </Example>

        <Example
          title="Links and button types"
          description="Use <a> for navigation, type=submit inside forms."
          code={dedent`
            <a href="#top" className="btn-outline">Link styled as button</a>
            <form id="demo-form" onSubmit={…}>…</form>
            <button type="submit" form="demo-form" className="btn-primary">Submit</button>
            <button type="reset" form="demo-form" className="btn-ghost">Reset</button>
          `}
        >
          <ButtonForm />
        </Example>
      </ExampleGrid>
    </GalleryPage>
  );
}

function ButtonForm() {
  const [name, setName] = useState('');
  const [sent, setSent] = useState(null);
  return (
    <div>
      <form id="buttons-demo-form" onSubmit={e => { e.preventDefault(); setSent(name || '(empty)'); }} onReset={() => { setName(''); setSent(null); }} className="mb-3">
        <label htmlFor="buttons-demo-name" className="form-label">Client name</label>
        <input id="buttons-demo-name" className="form-input" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Indus Textiles" />
      </form>
      <div className="flex flex-wrap gap-2">
        <button type="submit" form="buttons-demo-form" className="btn-primary">Submit</button>
        <button type="reset" form="buttons-demo-form" className="btn-ghost">Reset</button>
        <a href="#main-content" className="btn-outline">Link as button</a>
      </div>
      {sent && <p className="text-xs text-gray-500 mt-3" aria-live="polite">Submitted: <span className="font-semibold text-gray-800">{sent}</span></p>}
    </div>
  );
}
