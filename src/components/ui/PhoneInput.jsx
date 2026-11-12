import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Search, Check } from 'lucide-react';
import { countryByIso, searchCountries } from '../../data/countries';

// Windows has no flag emoji (they show as two letters), so fall back to a code badge there.
let flagSupport;
function supportsFlagEmoji() {
  if (flagSupport !== undefined) return flagSupport;
  try {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 16;
    const ctx = canvas.getContext('2d');
    ctx.font = '14px sans-serif';
    ctx.fillText('\u{1F1F5}\u{1F1F0}', 0, 14); // 🇵🇰
    const data = ctx.getImageData(0, 0, 16, 16).data;
    // A real flag is coloured; the two-letter fallback is monochrome.
    let coloured = false;
    for (let i = 0; i < data.length; i += 4) {
      if (data[i + 3] && (Math.abs(data[i] - data[i + 1]) > 20 || Math.abs(data[i + 1] - data[i + 2]) > 20)) { coloured = true; break; }
    }
    flagSupport = coloured;
  } catch {
    flagSupport = false;
  }
  return flagSupport;
}

function Flag({ country }) {
  if (supportsFlagEmoji()) return <span className="text-base leading-none" aria-hidden="true">{country.flag}</span>;
  return (
    <span className="inline-grid place-items-center w-7 h-[18px] rounded bg-gray-100 text-[9.5px] font-bold text-gray-600 tracking-wide" aria-hidden="true">
      {country.iso}
    </span>
  );
}

/**
 * Phone field with a searchable country-code picker (flag, name, +code).
 * Search by country name, ISO code or dial code: "uae", "AE", "971", "+971".
 * The parent keeps `country` (ISO code) and `value` (the number as typed).
 * Typing a full international number (+44…) also works and wins over the picker.
 */
export default function PhoneInput({ id, country, onCountryChange, value, onChange, placeholder = '300 1234567', invalid }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const wrap = useRef(null);
  const search = useRef(null);
  const list = useRef(null);
  const selected = countryByIso(country);
  const results = useMemo(() => searchCountries(query), [query]);
  const panel = useRef(null);
  const [pos, setPos] = useState(null);

  // The list is drawn at the top level (above dialogs and their scroll areas), lined up under the field.
  useLayoutEffect(() => {
    if (!open) return undefined;
    const place = () => {
      const r = wrap.current?.getBoundingClientRect();
      if (!r) return;
      const width = Math.max(r.width, Math.min(320, window.innerWidth - 16));
      const spaceBelow = window.innerHeight - r.bottom;
      const up = spaceBelow < 300 && r.top > spaceBelow;
      setPos({ left: Math.min(r.left, window.innerWidth - width - 8), width, top: up ? undefined : r.bottom + 6, bottom: up ? window.innerHeight - r.top + 6 : undefined });
    };
    place();
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    return () => { window.removeEventListener('resize', place); window.removeEventListener('scroll', place, true); };
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    setQuery('');
    setActive(Math.max(0, searchCountries('').findIndex(c => c.iso === selected.iso)));
    const t = setTimeout(() => search.current?.focus(), 0);
    const onDown = (e) => {
      if (wrap.current?.contains(e.target) || panel.current?.contains(e.target)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => { clearTimeout(t); document.removeEventListener('mousedown', onDown); };
  }, [open, selected.iso]);

  useEffect(() => { setActive(0); }, [query]);

  useEffect(() => {
    list.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [active, open]);

  const pick = (c) => {
    onCountryChange(c.iso);
    setOpen(false);
    document.getElementById(id)?.focus();
  };

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive(i => Math.min(i + 1, results.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(i => Math.max(i - 1, 0)); }
    else if (e.key === 'Enter') { e.preventDefault(); if (results[active]) pick(results[active]); }
    else if (e.key === 'Escape') { e.preventDefault(); setOpen(false); }
  };

  return (
    <div ref={wrap} className="relative">
      <div className={`flex items-stretch rounded-lg border bg-white transition-shadow focus-within:ring-2 focus-within:ring-primary-200 ${invalid ? 'border-danger-300' : 'border-gray-200 focus-within:border-primary-400'}`}>
        <button
          type="button"
          onClick={() => setOpen(o => !o)}
          className="flex items-center gap-1.5 pl-3 pr-2 border-r border-gray-200 text-sm text-gray-800 hover:bg-gray-50 rounded-l-lg shrink-0"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-label={`Country code: ${selected.name} +${selected.dial}. Change country`}
        >
          <Flag country={selected} />
          <span className="font-semibold tabular-nums">+{selected.dial}</span>
          <ChevronDown size={13} className={`text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
        </button>
        <input
          id={id}
          type="tel"
          inputMode="tel"
          autoComplete="tel-national"
          className="flex-1 min-w-0 px-3 py-2 text-sm bg-transparent outline-none text-gray-900 placeholder:text-gray-400"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          aria-invalid={invalid || undefined}
        />
      </div>

      {open && pos && createPortal(
        <div
          ref={panel}
          className="fixed z-[90] rounded-xl border border-gray-200 bg-white shadow-modal overflow-hidden"
          style={{ left: pos.left, width: pos.width, top: pos.top, bottom: pos.bottom }}
        >
          <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-100">
            <Search size={14} className="text-gray-400 shrink-0" aria-hidden="true" />
            <input
              ref={search}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Search country or code (e.g. UAE, 971)"
              className="flex-1 text-sm outline-none bg-transparent text-gray-900 placeholder:text-gray-400"
              role="combobox"
              aria-expanded="true"
              aria-controls={`${id}-countries`}
              aria-label="Search countries"
            />
          </div>
          <ul ref={list} id={`${id}-countries`} role="listbox" className="max-h-60 overflow-y-auto py-1">
            {results.length === 0 ? (
              <li className="px-3 py-3 text-xs text-gray-500">No country matches “{query}”.</li>
            ) : results.map((c, i) => (
              <li key={c.iso} data-index={i} role="option" aria-selected={c.iso === selected.iso}>
                <button
                  type="button"
                  onMouseEnter={() => setActive(i)}
                  onClick={() => pick(c)}
                  className={`w-full flex items-center gap-2.5 px-3 py-1.5 text-left text-sm transition-colors ${i === active ? 'bg-primary-50' : ''}`}
                >
                  <Flag country={c} />
                  <span className="flex-1 truncate text-gray-800">{c.name}</span>
                  <span className="text-xs text-gray-500 tabular-nums">+{c.dial}</span>
                  {c.iso === selected.iso && <Check size={13} className="text-brand" aria-hidden="true" />}
                </button>
              </li>
            ))}
          </ul>
        </div>,
        document.body,
      )}
    </div>
  );
}
