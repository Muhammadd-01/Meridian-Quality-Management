/**
 * Generic, schema-driven import/export used by every module (see data/entities.js
 * for field definitions). Projects keeps its original dedicated implementation in
 * utils/projectExportImport.js.
 */
import * as XLSX from 'xlsx';
import { generateId } from './format';

export const MAX_IMPORT_BYTES = 10 * 1024 * 1024;
export const IMPORT_EXTENSIONS = ['csv', 'xlsx', 'xls', 'json'];

export function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

const escapeHtml = (v) => String(v ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function cellValue(field, record) {
  const v = field.accessor ? field.accessor(record) : record[field.key];
  if (Array.isArray(v)) return v.join('; ');
  if (v === null || v === undefined) return '';
  return v;
}

/** Rows keyed by column label — the shape written to CSV/XLSX. */
export function toLabelledRows(records, fields) {
  return records.map(r => Object.fromEntries(fields.map(f => [f.label, cellValue(f, r)])));
}

function csvEscape(value) {
  const str = String(value ?? '');
  return /[",\n\r]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
}

export function buildCSV(records, fields) {
  const header = fields.map(f => csvEscape(f.label)).join(',');
  const rows = records.map(r => fields.map(f => csvEscape(cellValue(f, r))).join(','));
  // BOM so Excel opens UTF-8 (e.g. "—", "·") correctly.
  return '﻿' + [header, ...rows].join('\r\n');
}

/**
 * Export records. Returns { ok, count, filename } or throws with a readable message.
 * PDF uses the browser's print dialog ("Save as PDF"); it returns ok only if the
 * print window could be opened.
 */
export function exportRecords({ records, fields, format, filename, title }) {
  if (!records || records.length === 0) throw new Error('There are no records to export.');
  const stamp = new Date().toISOString().slice(0, 10);
  const base = `${filename}_${stamp}`;

  if (format === 'csv') {
    triggerDownload(new Blob([buildCSV(records, fields)], { type: 'text/csv;charset=utf-8;' }), `${base}.csv`);
    return { ok: true, count: records.length, filename: `${base}.csv` };
  }
  if (format === 'xlsx') {
    const ws = XLSX.utils.json_to_sheet(toLabelledRows(records, fields));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, (title || 'Export').slice(0, 31));
    const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    triggerDownload(new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), `${base}.xlsx`);
    return { ok: true, count: records.length, filename: `${base}.xlsx` };
  }
  if (format === 'json') {
    const data = records.map(r => Object.fromEntries(fields.map(f => [f.key, f.accessor ? f.accessor(r) : r[f.key] ?? null])));
    triggerDownload(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }), `${base}.json`);
    return { ok: true, count: records.length, filename: `${base}.json` };
  }
  if (format === 'pdf') {
    const win = window.open('', '_blank');
    if (!win) throw new Error('The print window was blocked. Allow pop-ups for this site to save as PDF.');
    win.document.write(`<!DOCTYPE html><html><head><title>${escapeHtml(base)}</title>
      <style>
        body{font-family:Inter,-apple-system,"Segoe UI",Roboto,sans-serif;padding:24px;color:#102C32}
        h1{font-size:18px;margin:0 0 4px;color:#093F50}
        p{font-size:11px;color:#52676A;margin:0 0 16px}
        table{width:100%;border-collapse:collapse;font-size:10px}
        th{background:#F5F3EC;color:#52676A;text-align:left;padding:6px 8px;border-bottom:2px solid #C9D9D8;text-transform:uppercase}
        td{padding:6px 8px;border-bottom:1px solid #DFE7E3;vertical-align:top}
        tr:nth-child(even) td{background:#FBF8E8}
      </style></head><body>
      <h1>Meridian Quality Management — ${escapeHtml(title || filename)}</h1>
      <p>Exported ${escapeHtml(new Date().toLocaleString())} · ${records.length} records</p>
      <table><thead><tr>${fields.map(f => `<th>${escapeHtml(f.label)}</th>`).join('')}</tr></thead>
      <tbody>${records.map(r => `<tr>${fields.map(f => `<td>${escapeHtml(cellValue(f, r))}</td>`).join('')}</tr>`).join('')}</tbody></table>
      <script>window.onload=function(){window.print();}</script></body></html>`);
    win.document.close();
    return { ok: true, count: records.length, filename: 'print dialog' };
  }
  throw new Error(`Unsupported export format: ${format}`);
}

/** Download a template with the expected headers and one illustrative row. */
export function downloadTemplate(entity, format = 'csv') {
  const fields = entity.fields;
  const example = Object.fromEntries(fields.map(f => {
    if (f.type === 'number') return [f.label, 0];
    if (f.type === 'date') return [f.label, new Date().toISOString().slice(0, 10)];
    if (f.type === 'enum') return [f.label, f.options?.[0] ?? ''];
    if (f.type === 'email') return [f.label, 'name@example.com'];
    if (f.type === 'list') return [f.label, 'tag one; tag two'];
    return [f.label, f.required ? `Example ${f.label}` : ''];
  }));
  const name = `${entity.type}_import_template`;
  if (format === 'xlsx') {
    const ws = XLSX.utils.json_to_sheet([example]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template');
    const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    triggerDownload(new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), `${name}.xlsx`);
  } else if (format === 'json') {
    const obj = Object.fromEntries(fields.map(f => [f.key, example[f.label]]));
    triggerDownload(new Blob([JSON.stringify([obj], null, 2)], { type: 'application/json' }), `${name}.json`);
  } else {
    triggerDownload(new Blob([buildCSV([example], fields.map(f => ({ ...f, key: f.label })))], { type: 'text/csv;charset=utf-8;' }), `${name}.csv`);
  }
}

/** Read a File into an array of plain row objects plus the list of source columns. */
export async function readFileRows(file) {
  if (!file) throw new Error('No file selected.');
  const ext = file.name.split('.').pop()?.toLowerCase();
  if (!IMPORT_EXTENSIONS.includes(ext)) throw new Error('Unsupported file type. Upload a .csv, .xlsx or .json file.');
  if (file.size > MAX_IMPORT_BYTES) throw new Error('File exceeds the 10 MB limit.');
  if (file.size === 0) throw new Error('The file is empty.');

  let rows;
  if (ext === 'json') {
    let parsed;
    try {
      parsed = JSON.parse(await file.text());
    } catch {
      throw new Error('The JSON file could not be parsed.');
    }
    rows = Array.isArray(parsed) ? parsed : [parsed];
    rows = rows.filter(r => r && typeof r === 'object' && !Array.isArray(r));
  } else {
    const wb = ext === 'csv'
      ? XLSX.read((await file.text()).replace(/^﻿/, ''), { type: 'string', raw: true })
      : XLSX.read(await file.arrayBuffer(), { type: 'array', cellDates: true });
    const sheet = wb.Sheets[wb.SheetNames[0]];
    rows = XLSX.utils.sheet_to_json(sheet, { defval: '', raw: false });
  }
  if (!rows.length) throw new Error('No data rows were found in the file.');
  const columns = Array.from(new Set(rows.flatMap(r => Object.keys(r))));
  return { rows, columns };
}

const norm = (s) => String(s ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');

/** Guess column → field mapping by matching labels and keys. */
export function autoMapColumns(columns, fields) {
  const mapping = {};
  fields.forEach(f => {
    const candidates = [norm(f.label), norm(f.key), norm(f.label.replace(/\(.*\)/, ''))];
    const match = columns.find(c => candidates.includes(norm(c)));
    mapping[f.key] = match || '';
  });
  return mapping;
}

function coerce(field, raw) {
  const value = typeof raw === 'string' ? raw.trim() : raw;
  if (value === '' || value === null || value === undefined) return { value: undefined };
  switch (field.type) {
    case 'number': {
      const n = Number(String(value).replace(/[, ]/g, '').replace(/^PKR/i, ''));
      return Number.isFinite(n) ? { value: n } : { error: `${field.label} must be a number` };
    }
    case 'date': {
      const d = value instanceof Date ? value : new Date(value);
      return Number.isNaN(d.getTime()) ? { error: `${field.label} is not a valid date` } : { value: d.toISOString().slice(0, 10) };
    }
    case 'email':
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value)) ? { value: String(value) } : { error: `${field.label} is not a valid email` };
    case 'enum': {
      const opt = field.options?.find(o => norm(o) === norm(value));
      return opt ? { value: opt } : { error: `${field.label} must be one of: ${field.options.join(', ')}` };
    }
    case 'list':
      return { value: String(value).split(/[;|]/).map(s => s.trim()).filter(Boolean) };
    default:
      return { value: String(value) };
  }
}

export function dedupeSignature(record, keys) {
  if (keys.some(k => record[k] === undefined || record[k] === null || String(record[k]).trim() === '')) return null;
  return keys.map(k => norm(record[k])).join('|');
}

/**
 * Validate mapped rows against the entity schema and existing records.
 * Returns rows: [{ rowNumber, data, errors, duplicateOf }]
 */
export function validateRows({ rows, mapping, entity, existing }) {
  const existingIndex = entity.dedupeKeys.map(keys => {
    const map = new Map();
    existing.forEach(r => {
      const sig = dedupeSignature(r, keys);
      if (sig) map.set(sig, r);
    });
    return { keys, map };
  });
  const seenInFile = entity.dedupeKeys.map(() => new Set());

  return rows.map((row, idx) => {
    const data = {};
    const errors = [];
    entity.fields.forEach(f => {
      const col = mapping[f.key];
      const { value, error } = coerce(f, col ? row[col] : undefined);
      if (error) errors.push(error);
      else if (value !== undefined) data[f.key] = value;
      if (f.required && (value === undefined || value === '') && !error) errors.push(`${f.label} is required`);
    });

    let duplicateOf = null;
    let duplicateInFile = false;
    entity.dedupeKeys.forEach((keys, i) => {
      const sig = dedupeSignature(data, keys);
      if (!sig) return;
      if (!duplicateOf && existingIndex[i].map.has(sig)) duplicateOf = existingIndex[i].map.get(sig);
      if (seenInFile[i].has(sig)) duplicateInFile = true;
      seenInFile[i].add(sig);
    });
    if (duplicateInFile) errors.push('Duplicate of an earlier row in this file');

    return { rowNumber: idx + 2, data, errors, duplicateOf };
  });
}

/**
 * Apply validated rows to a collection.
 * mode: 'skip' (default — duplicates are left untouched) | 'update' (merge into existing record)
 * Returns { next, created, updated, skipped, failed }
 */
export function applyImport({ validated, existing, entity, mode = 'skip' }) {
  let created = 0;
  let updated = 0;
  let skipped = 0;
  let failed = 0;
  const updates = new Map();
  const additions = [];

  validated.forEach(row => {
    if (row.errors.length) { failed += 1; return; }
    if (row.duplicateOf) {
      if (mode === 'update') {
        updates.set(row.duplicateOf.id, { ...(updates.get(row.duplicateOf.id) || {}), ...row.data });
        updated += 1;
      } else {
        skipped += 1;
      }
      return;
    }
    const defaults = entity.defaults ? entity.defaults(row.data) : {};
    additions.push({ ...defaults, ...row.data, id: `${entity.type}-${generateId()}` });
    created += 1;
  });

  const next = [
    ...additions,
    ...existing.map(r => (updates.has(r.id) ? { ...r, ...updates.get(r.id) } : r)),
  ];
  return { next, created, updated, skipped, failed };
}

export function downloadErrorReport(validated, entityType) {
  const failed = validated.filter(r => r.errors.length);
  if (!failed.length) return;
  const fields = [
    { key: 'rowNumber', label: 'Row' },
    { key: 'errors', label: 'Errors', accessor: r => r.errors.join(' | ') },
  ];
  triggerDownload(new Blob([buildCSV(failed, fields)], { type: 'text/csv;charset=utf-8;' }), `${entityType}_import_errors.csv`);
}
