/**
 * Building blocks for the UI Elements style guide.
 *
 *   <GalleryPage title subtitle classes={['.btn-primary', …]}>…</GalleryPage>
 *   <Example title description code={dedent`…`}>live preview</Example>
 *   <CodeBlock code />, <CopyButton text label />, useCopy()
 *
 * Every example shows a live preview and a copy-ready snippet. Copying uses
 * the Clipboard API, with a hidden-textarea fallback for older browsers and
 * non-secure origins.
 */
import React, { useCallback, useId, useRef, useState } from 'react';
import { Check, Code2, Copy } from 'lucide-react';
import PageHeader from '../../../components/ui/PageHeader';
import { useToast } from '../../../components/ui/Toast';

/** Strips the common leading indentation from a template literal. */
export function dedent(strings, ...values) {
  const raw = typeof strings === 'string' ? strings : strings.reduce((acc, s, i) => acc + s + (i < values.length ? values[i] : ''), '');
  const lines = raw.replace(/^\n/, '').replace(/\s+$/, '').split('\n');
  const indent = Math.min(...lines.filter(l => l.trim()).map(l => l.match(/^ */)[0].length));
  return lines.map(l => l.slice(indent)).join('\n');
}

async function writeClipboard(text) {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // fall through to the legacy path
  }
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.setAttribute('readonly', '');
  ta.style.position = 'fixed';
  ta.style.opacity = '0';
  document.body.appendChild(ta);
  ta.select();
  let ok = false;
  try { ok = document.execCommand('copy'); } catch { ok = false; }
  document.body.removeChild(ta);
  return ok;
}

/** Copies text and reports it with a toast. `copied` holds the last key for ~1.6s. */
export function useCopy() {
  const addToast = useToast();
  const [copied, setCopied] = useState(null);
  const timer = useRef();
  const copy = useCallback(async (text, label = 'Text', key = label) => {
    const ok = await writeClipboard(text);
    clearTimeout(timer.current);
    if (ok) {
      setCopied(key);
      timer.current = setTimeout(() => setCopied(null), 1600);
      addToast?.(`${label} copied to clipboard`, 'success', 2200);
    } else {
      addToast?.('Copy failed — your browser blocked clipboard access.', 'error', 4000);
    }
    return ok;
  }, [addToast]);
  return { copy, copied };
}

export function CopyButton({ text, label = 'Code', className = 'btn-outline btn-sm', children }) {
  const { copy, copied } = useCopy();
  const done = copied === label;
  return (
    <button type="button" className={className} onClick={() => copy(text, label)} aria-label={children ? undefined : `Copy ${label.toLowerCase()}`}>
      {done ? <Check size={14} aria-hidden="true" className="text-success-500" /> : <Copy size={14} aria-hidden="true" />}
      {children ?? (done ? 'Copied' : 'Copy')}
    </button>
  );
}

export function CodeBlock({ code, label = 'Code', id }) {
  return (
    <div className="relative group/code" id={id}>
      <pre className="text-[12px] leading-relaxed font-mono text-gray-800 bg-surface-sunken p-4 pr-24 overflow-x-auto max-h-80 whitespace-pre">
        <code>{code}</code>
      </pre>
      <div className="absolute top-2 right-2">
        <CopyButton text={code} label={label} className="btn-outline btn-xs !py-1" />
      </div>
    </div>
  );
}

/** One example card: header, live preview and a toggleable, copyable snippet. */
export function Example({ title, description, code, children, className = '', bodyClassName = 'card-body', badge }) {
  const [show, setShow] = useState(false);
  const codeId = useId();
  return (
    <section className={`card min-w-0 ${className}`} aria-label={title}>
      <div className="card-header flex-wrap gap-2">
        <div className="min-w-0">
          <h2 className="text-[15px] font-bold text-gray-900 flex items-center gap-2 flex-wrap">{title}{badge}</h2>
          {description && <p className="text-xs text-gray-500 mt-0.5">{description}</p>}
        </div>
        {code && (
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              className={`btn-sm ${show ? 'btn-secondary' : 'btn-ghost'}`}
              onClick={() => setShow(s => !s)}
              aria-expanded={show}
              aria-controls={codeId}
            >
              <Code2 size={14} aria-hidden="true" /> {show ? 'Hide code' : 'Show code'}
            </button>
            <CopyButton text={code} label={`${title} code`} className="btn-outline btn-sm" />
          </div>
        )}
      </div>
      <div className={bodyClassName}>{children}</div>
      {code && show && (
        <div className="border-t border-gray-100 animate-fade-in rounded-b-lg overflow-hidden">
          <CodeBlock code={code} id={codeId} label={`${title} code`} />
        </div>
      )}
    </section>
  );
}

/** Page wrapper with heading and the list of design-system classes it documents. */
export function GalleryPage({ title, subtitle, classes, actions, children }) {
  return (
    <div className="min-w-0">
      <PageHeader title={title} subtitle={subtitle} actions={actions} />
      {classes?.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 mb-5 -mt-3 animate-rise-in" aria-label="Classes and components on this page">
          <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 me-1">Uses</span>
          {classes.map(c => <code key={c} className="text-[11px] font-semibold px-1.5 py-0.5 rounded bg-surface-sunken text-gray-700 border border-gray-200">{c}</code>)}
        </div>
      )}
      <div className="space-y-5">{children}</div>
    </div>
  );
}

/** Two-column responsive grid for example cards. */
export function ExampleGrid({ children, cols = 2 }) {
  const c = cols === 3 ? 'lg:grid-cols-2 2xl:grid-cols-3' : 'xl:grid-cols-2';
  return <div className={`grid grid-cols-1 ${c} gap-5 items-start`}>{children}</div>;
}

/** Small uppercase caption used inside previews. */
export function Caption({ children }) {
  return <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-2">{children}</p>;
}
