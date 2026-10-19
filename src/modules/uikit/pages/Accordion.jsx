import React, { useId, useState } from 'react';
import { ChevronDown, Plus, Minus, FileCheck2, ClipboardList, GraduationCap } from 'lucide-react';
import { GalleryPage, Example, ExampleGrid, dedent } from '../kit/Gallery';

const ITEMS = [
  { title: 'What does an ISO 9001 audit cover?', body: 'Auditors review your quality management system against each clause: context, leadership, planning, support, operation, performance evaluation and improvement.', icon: FileCheck2 },
  { title: 'How long does certification take?', body: 'Most organisations complete stage 1 and stage 2 audits within 8–12 weeks, depending on documentation readiness and corrective actions.', icon: ClipboardList },
  { title: 'Do you run training for internal auditors?', body: 'Yes — our two-day internal auditor course runs monthly in Lahore, Karachi and Islamabad, and online for international teams.', icon: GraduationCap },
];

const STYLES = {
  bordered: { wrap: 'rounded-md border border-gray-200 divide-y divide-gray-200 overflow-hidden', btn: 'hover:bg-gray-50', open: 'bg-gray-50 text-gray-900', panel: '' },
  separated: { wrap: 'space-y-2', item: 'rounded-md border border-gray-200 overflow-hidden', btn: 'hover:bg-gray-50', open: 'text-primary-600 [[data-theme=dark]_&]:text-primary-300', panel: '' },
  flush: { wrap: 'divide-y divide-gray-200', btn: 'px-0 hover:text-gray-900', open: 'text-gray-900', panel: 'px-0' },
  primaryLight: { wrap: 'space-y-2', item: 'rounded-md overflow-hidden bg-primary-50', btn: '', open: 'text-primary-700 [[data-theme=dark]_&]:text-primary-300', panel: '' },
  primarySolid: { wrap: 'space-y-2', item: 'rounded-md overflow-hidden border border-gray-200', btn: 'hover:bg-gray-50', open: '!bg-primary-600 !text-white', panel: '' },
  coloredBorder: { wrap: 'space-y-2', item: 'rounded-md overflow-hidden border border-gray-200 has-[[aria-expanded=true]]:border-primary-500', btn: '', open: 'text-primary-600 [[data-theme=dark]_&]:text-primary-300', panel: '' },
};

function Accordion({ items = ITEMS, variant = 'bordered', multiple = false, defaultOpen = [0], iconStyle = 'chevron', withLeadingIcon = false }) {
  const [open, setOpen] = useState(defaultOpen);
  const base = useId();
  const s = STYLES[variant];
  const toggle = (i) => setOpen(o => (o.includes(i) ? o.filter(x => x !== i) : multiple ? [...o, i] : [i]));

  const onKeyDown = (e, i) => {
    const keys = { ArrowDown: i + 1, ArrowUp: i - 1, Home: 0, End: items.length - 1 };
    if (!(e.key in keys)) return;
    e.preventDefault();
    const next = (keys[e.key] + items.length) % items.length;
    document.getElementById(`${base}-btn-${next}`)?.focus();
  };

  return (
    <div className={s.wrap}>
      {items.map((it, i) => {
        const isOpen = open.includes(i);
        const Lead = it.icon;
        return (
          <div key={it.title} className={s.item || ''}>
            <h3>
              <button
                type="button"
                id={`${base}-btn-${i}`}
                aria-expanded={isOpen}
                aria-controls={`${base}-panel-${i}`}
                onClick={() => toggle(i)}
                onKeyDown={(e) => onKeyDown(e, i)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left text-[13.5px] font-semibold text-gray-700 transition-colors ${s.btn} ${isOpen ? s.open : ''}`}
              >
                {withLeadingIcon && Lead && <Lead size={16} aria-hidden="true" className="shrink-0 opacity-80" />}
                <span className="flex-1 min-w-0">{it.title}</span>
                {iconStyle === 'chevron' && <ChevronDown size={16} aria-hidden="true" className={`shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />}
                {iconStyle === 'plus' && (isOpen ? <Minus size={16} aria-hidden="true" className="shrink-0" /> : <Plus size={16} aria-hidden="true" className="shrink-0" />)}
              </button>
            </h3>
            <div
              id={`${base}-panel-${i}`}
              role="region"
              aria-labelledby={`${base}-btn-${i}`}
              className={`grid transition-[grid-template-rows] duration-300 ease-spring ${isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}
              inert={isOpen ? undefined : ''}
            >
              <div className="overflow-hidden">
                <p className={`px-4 pb-4 pt-1 text-[13px] text-gray-600 leading-relaxed ${s.panel}`}>{it.body}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

const SNIPPET = dedent`
  const [open, setOpen] = useState([0]);
  const toggle = (i) => setOpen(o => o.includes(i) ? o.filter(x => x !== i) : [i]);

  <div className="rounded-md border border-gray-200 divide-y divide-gray-200 overflow-hidden">
    {items.map((it, i) => (
      <div key={it.title}>
        <h3>
          <button type="button" aria-expanded={open.includes(i)} aria-controls={\`panel-\${i}\`}
            onClick={() => toggle(i)}
            className="w-full flex items-center gap-3 px-4 py-3 text-left text-[13.5px] font-semibold text-gray-700 hover:bg-gray-50">
            <span className="flex-1">{it.title}</span>
            <ChevronDown size={16} className={open.includes(i) ? 'rotate-180 transition-transform' : 'transition-transform'} />
          </button>
        </h3>
        <div id={\`panel-\${i}\`} role="region"
          className={\`grid transition-[grid-template-rows] duration-300 \${open.includes(i) ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}\`}>
          <div className="overflow-hidden">
            <p className="px-4 pb-4 pt-1 text-[13px] text-gray-600">{it.body}</p>
          </div>
        </div>
      </div>
    ))}
  </div>
`;

export default function AccordionPage() {
  return (
    <GalleryPage
      title="Accordion"
      subtitle="Disclosure panels with animated height, ARIA wiring (aria-expanded, aria-controls, region) and arrow-key navigation between headers."
      classes={['grid-rows-[0fr]→[1fr]', 'aria-expanded', 'divide-y', 'border-gray-200']}
    >
      <ExampleGrid>
        <Example title="Bordered accordion" description="One panel open at a time. Use ↑ ↓ Home End to move between headers." code={SNIPPET}>
          <Accordion />
        </Example>
        <Example title="Always open" description="Several panels can stay open together." code={SNIPPET.replace(': [i]', ': [...o, i]')}>
          <Accordion variant="separated" multiple defaultOpen={[0, 1]} />
        </Example>
        <Example
          title="Custom icon"
          description="Plus / minus indicator and leading icons."
          code={dedent`
            {open ? <Minus size={16} aria-hidden="true" /> : <Plus size={16} aria-hidden="true" />}
          `}
        >
          <Accordion iconStyle="plus" withLeadingIcon defaultOpen={[]} />
        </Example>
        <Example
          title="Flush, without arrow"
          description="Edge-to-edge rows for use inside cards."
          code={dedent`
            <div className="divide-y divide-gray-200">
              <button type="button" aria-expanded={isOpen}
                className="w-full px-0 py-3 text-left text-[13.5px] font-semibold text-gray-700">…</button>
            </div>
          `}
        >
          <Accordion variant="flush" iconStyle="none" defaultOpen={[1]} />
        </Example>
        <Example
          title="Primary — light colour"
          description="Tinted items using bg-primary-50."
          code={dedent`
            <div className="rounded-md overflow-hidden bg-primary-50">
              <button type="button" aria-expanded={isOpen}
                className="w-full flex items-center gap-3 px-4 py-3 text-left text-[13.5px] font-semibold text-primary-700">…</button>
            </div>
          `}
        >
          <Accordion variant="primaryLight" />
        </Example>
        <Example
          title="Primary — solid & coloured border"
          description="The open header takes the brand fill; borders highlight the active item."
          code={dedent`
            <button type="button" aria-expanded={isOpen}
              className={\`w-full px-4 py-3 text-left font-semibold \${isOpen ? 'bg-primary-600 text-white' : 'text-gray-700 hover:bg-gray-50'}\`}>…</button>

            <div className="rounded-md border border-gray-200 has-[[aria-expanded=true]]:border-primary-500">…</div>
          `}
        >
          <div className="space-y-5">
            <Accordion variant="primarySolid" />
            <Accordion variant="coloredBorder" defaultOpen={[2]} />
          </div>
        </Example>
      </ExampleGrid>
    </GalleryPage>
  );
}
