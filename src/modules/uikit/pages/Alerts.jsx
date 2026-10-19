import React, { useState } from 'react';
import { AlertCircle, AlertTriangle, CheckCircle2, Info, Sparkles, X, RotateCcw, ShieldCheck } from 'lucide-react';
import { GalleryPage, Example, ExampleGrid, dedent } from '../kit/Gallery';
import { SOLID, SOFT, TEXT, BORDER, TONES, TONE_LABEL } from '../kit/tones';

const ICONS = { primary: Sparkles, success: CheckCircle2, warning: AlertTriangle, danger: AlertCircle, info: Info, accent: ShieldCheck, dark: Info };
const MESSAGES = {
  primary: 'A new audit template is available for ISO 9001.',
  success: 'Certificate issued and emailed to the client.',
  warning: 'Calibration for 3 instruments is due this week.',
  danger: 'Non-conformity NC-118 is overdue by 4 days.',
  info: 'Surveillance audit scheduled for 12 November.',
  accent: 'Your workspace is on the Professional plan.',
  dark: 'Maintenance window tonight, 01:00 – 02:00 PKT.',
};

function Alert({ tone = 'primary', variant = 'soft', title, children, icon = true, onClose, actions }) {
  const Icon = ICONS[tone];
  const styles = {
    solid: `${SOLID[tone]} border-transparent`,
    soft: `${SOFT[tone]} text-gray-700`,
    outline: `bg-transparent ${BORDER[tone]} ${TEXT[tone]}`,
    accentLeft: `${SOFT[tone]} border-l-4 ${BORDER[tone]} text-gray-700`,
  }[variant];
  const iconColor = variant === 'solid' ? 'text-white/90' : TEXT[tone];
  return (
    <div role={tone === 'danger' || tone === 'warning' ? 'alert' : 'status'} className={`flex items-start gap-3 rounded-md border px-4 py-3 text-[13px] ${styles}`}>
      {icon && <Icon size={17} className={`shrink-0 mt-px ${iconColor}`} aria-hidden="true" />}
      <div className="flex-1 min-w-0">
        {title && <p className={`font-bold ${variant === 'solid' ? 'text-white' : variant === 'outline' ? '' : 'text-gray-900'}`}>{title}</p>}
        <div className={title ? 'mt-0.5' : ''}>{children}</div>
        {actions && <div className="mt-3 flex flex-wrap gap-2">{actions}</div>}
      </div>
      {onClose && (
        <button type="button" onClick={onClose} aria-label="Dismiss alert" className={`shrink-0 grid place-items-center w-6 h-6 rounded-full transition-colors ${variant === 'solid' ? 'hover:bg-white/15' : 'hover:bg-gray-900/5 [[data-theme=dark]_&]:hover:bg-white/10'}`}>
          <X size={14} aria-hidden="true" />
        </button>
      )}
    </div>
  );
}

const ALL = [...TONES, 'dark'];

export default function Alerts() {
  const [dismissed, setDismissed] = useState([]);
  const visible = ALL.filter(t => !dismissed.includes(t));
  const [actionDone, setActionDone] = useState(null);

  return (
    <GalleryPage
      title="Alerts"
      subtitle="Contextual feedback messages in solid, soft, outline and accent-border styles. Every tone uses design tokens, so alerts read correctly in light and dark mode."
      classes={['bg-{tone}-50', 'text-{tone}-600', 'border-{tone}-500', 'role="alert"']}
    >
      <ExampleGrid>
        <Example
          title="Solid alerts"
          description="High-emphasis fills with white text."
          code={dedent`
            <div role="status" className="flex items-start gap-3 rounded-md px-4 py-3 text-[13px] bg-primary-600 text-white">
              <Sparkles size={17} className="shrink-0 mt-px text-white/90" aria-hidden="true" />
              <p>A new audit template is available for ISO 9001.</p>
            </div>
          `}
        >
          <div className="space-y-2.5">
            {ALL.map(t => <Alert key={t} tone={t} variant="solid">{MESSAGES[t]}</Alert>)}
          </div>
        </Example>

        <Example
          title="Soft alerts"
          description="Tinted surfaces for everyday notices."
          code={dedent`
            <div role="status" className="flex items-start gap-3 rounded-md border px-4 py-3 text-[13px] bg-success-50 border-success-500/30 text-gray-700">
              <CheckCircle2 size={17} className="shrink-0 mt-px text-success-600" aria-hidden="true" />
              <p>Certificate issued and emailed to the client.</p>
            </div>
          `}
        >
          <div className="space-y-2.5">
            {ALL.map(t => <Alert key={t} tone={t}>{MESSAGES[t]}</Alert>)}
          </div>
        </Example>

        <Example
          title="Outline alerts"
          description="Transparent background, toned border and text."
          code={dedent`
            <div role="alert" className="flex items-start gap-3 rounded-md border px-4 py-3 text-[13px] border-warning-500 text-warning-700">
              <AlertTriangle size={17} className="shrink-0 mt-px" aria-hidden="true" />
              <p>Calibration for 3 instruments is due this week.</p>
            </div>
          `}
        >
          <div className="space-y-2.5">
            {TONES.map(t => <Alert key={t} tone={t} variant="outline">{MESSAGES[t]}</Alert>)}
          </div>
        </Example>

        <Example
          title="Dismissible alerts"
          description="Close any alert; reset brings them back."
          code={dedent`
            const [open, setOpen] = useState(true);

            {open && (
              <div role="status" className="flex items-start gap-3 rounded-md border px-4 py-3 text-[13px] bg-info-50 border-info-500/30 text-gray-700">
                <Info size={17} className="shrink-0 mt-px text-info-600" aria-hidden="true" />
                <p className="flex-1">Surveillance audit scheduled for 12 November.</p>
                <button type="button" onClick={() => setOpen(false)} aria-label="Dismiss alert"
                  className="grid place-items-center w-6 h-6 rounded-full hover:bg-gray-900/5">
                  <X size={14} aria-hidden="true" />
                </button>
              </div>
            )}
          `}
        >
          <div className="space-y-2.5">
            {visible.map(t => (
              <div key={t} className="animate-fade-in">
                <Alert tone={t} variant={t === 'dark' ? 'solid' : 'soft'} onClose={() => setDismissed(d => [...d, t])}>{MESSAGES[t]}</Alert>
              </div>
            ))}
            {visible.length === 0 && <p className="text-sm text-gray-500 py-6 text-center">All alerts dismissed.</p>}
            <button type="button" className="btn-outline btn-sm" onClick={() => setDismissed([])} disabled={!dismissed.length}>
              <RotateCcw size={14} aria-hidden="true" /> Reset ({dismissed.length} hidden)
            </button>
          </div>
        </Example>

        <Example
          title="Alerts with title and list"
          description="Group related details under a heading."
          code={dedent`
            <div role="alert" className="flex items-start gap-3 rounded-md border px-4 py-3 text-[13px] bg-danger-50 border-danger-500/30 text-gray-700">
              <AlertCircle size={17} className="shrink-0 mt-px text-danger-600" aria-hidden="true" />
              <div>
                <p className="font-bold text-gray-900">3 fields need attention</p>
                <ul className="mt-1 list-disc ps-4 space-y-0.5">
                  <li>Client name is required</li>
                  <li>Audit date must be in the future</li>
                  <li>Select at least one standard</li>
                </ul>
              </div>
            </div>
          `}
        >
          <div className="space-y-2.5">
            <Alert tone="danger" title="3 fields need attention">
              <ul className="mt-1 list-disc ps-4 space-y-0.5">
                <li>Client name is required</li>
                <li>Audit date must be in the future</li>
                <li>Select at least one standard</li>
              </ul>
            </Alert>
            <Alert tone="success" title="Audit closed">All 14 checklist items passed. The report is ready to share.</Alert>
            <Alert tone="info" variant="accentLeft" title="Accent border">A left border draws the eye without a heavy fill.</Alert>
          </div>
        </Example>

        <Example
          title="Alerts with actions"
          description="Buttons inside an alert trigger follow-up actions."
          code={dedent`
            <div role="alert" className="flex items-start gap-3 rounded-md border px-4 py-3 text-[13px] bg-warning-50 border-warning-500/30 text-gray-700">
              <AlertTriangle size={17} className="shrink-0 mt-px text-warning-700" aria-hidden="true" />
              <div className="flex-1">
                <p className="font-bold text-gray-900">Storage almost full</p>
                <p className="mt-0.5">You have used 92% of this browser's storage.</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button type="button" className="btn-primary btn-sm">Export data</button>
                  <button type="button" className="btn-outline btn-sm">Remind me later</button>
                </div>
              </div>
            </div>
          `}
        >
          <div className="space-y-2.5">
            <Alert
              tone="warning"
              title="Storage almost full"
              actions={(
                <>
                  <button type="button" className="btn-primary btn-sm" onClick={() => setActionDone('Export started')}>Export data</button>
                  <button type="button" className="btn-outline btn-sm" onClick={() => setActionDone('We will remind you tomorrow')}>Remind me later</button>
                </>
              )}
            >
              You have used 92% of this browser's storage.
            </Alert>
            <Alert
              tone="dark"
              variant="solid"
              title="New version available"
              actions={<button type="button" className="btn-glass btn-sm" onClick={() => setActionDone('Release notes opened')}>What's new</button>}
            >
              Meridian 2.4 adds report scheduling and faster search.
            </Alert>
            {actionDone && <p className="text-xs text-gray-500" aria-live="polite">Action: <span className="font-semibold text-gray-800">{actionDone}</span></p>}
          </div>
        </Example>

        <Example
          title="Without icons"
          description="Compact text-only alerts."
          code={dedent`
            <div role="status" className="rounded-md border px-4 py-3 text-[13px] bg-primary-50 border-primary-500/30 text-gray-700">
              <span className="font-bold text-gray-900">Tip:</span> press Ctrl + K to search anything.
            </div>
          `}
        >
          <div className="space-y-2.5">
            {['primary', 'info', 'accent'].map(t => (
              <Alert key={t} tone={t} icon={false}><span className="font-bold text-gray-900">{TONE_LABEL[t]}:</span> {MESSAGES[t]}</Alert>
            ))}
          </div>
        </Example>
      </ExampleGrid>
    </GalleryPage>
  );
}
