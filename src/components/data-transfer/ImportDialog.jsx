import React, { useMemo, useRef, useState } from 'react';
import { UploadCloud, FileText, Download, AlertTriangle, CheckCircle2, Loader2, ArrowLeft, Copy } from 'lucide-react';
import Modal from '../ui/Modal';
import { useToast } from '../ui/Toast';
import {
  readFileRows, autoMapColumns, validateRows, applyImport, downloadTemplate, downloadErrorReport, IMPORT_EXTENSIONS,
} from '../../utils/dataTransfer';
import { withAuditContext } from '../../lib/auditLog';

const STEPS = ['Upload', 'Map columns', 'Review', 'Done'];

/**
 * Import dialog: upload → column mapping → validated preview → summary.
 * Duplicates are skipped by default; updating existing records requires an
 * explicit choice plus confirmation. Nothing is written until "Import" is pressed.
 */
export default function ImportDialog({ isOpen, onClose, entity, records, setRecords }) {
  const addToast = useToast();
  const inputRef = useRef(null);
  const [step, setStep] = useState(0);
  const [file, setFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [parsed, setParsed] = useState(null);
  const [mapping, setMapping] = useState({});
  const [mode, setMode] = useState('skip');
  const [confirmUpdate, setConfirmUpdate] = useState(false);
  const [result, setResult] = useState(null);

  const reset = () => {
    setStep(0); setFile(null); setError(''); setParsed(null); setMapping({});
    setMode('skip'); setConfirmUpdate(false); setResult(null); setBusy(false);
  };

  const close = () => {
    if (busy) return;
    reset();
    onClose();
  };

  const handleFile = async (f) => {
    setError('');
    if (!f) return;
    setFile(f);
    setBusy(true);
    try {
      const data = await readFileRows(f);
      setParsed(data);
      setMapping(autoMapColumns(data.columns, entity.fields));
      setStep(1);
    } catch (err) {
      setError(err.message || 'The file could not be read.');
      setFile(null);
    } finally {
      setBusy(false);
    }
  };

  const missingRequired = entity.fields.filter(f => f.required && !mapping[f.key]);

  const validated = useMemo(() => {
    if (step < 2 || !parsed) return [];
    return validateRows({ rows: parsed.rows, mapping, entity, existing: records });
  }, [step, parsed, mapping, entity, records]);

  const counts = useMemo(() => ({
    valid: validated.filter(r => !r.errors.length && !r.duplicateOf).length,
    duplicates: validated.filter(r => !r.errors.length && r.duplicateOf).length,
    errors: validated.filter(r => r.errors.length).length,
  }), [validated]);

  const actionable = counts.valid + (mode === 'update' ? counts.duplicates : 0);
  const canImport = actionable > 0 && (mode !== 'update' || counts.duplicates === 0 || confirmUpdate);

  const handleImport = () => {
    setBusy(true);
    try {
      const outcome = applyImport({ validated, existing: records, entity, mode });
      withAuditContext('import', () => setRecords(outcome.next));
      setResult(outcome);
      setStep(3);
      addToast(`Imported ${outcome.created} new and updated ${outcome.updated} ${entity.label.toLowerCase()}.`, 'success', 4000);
    } catch (err) {
      setError(err.message || 'Import failed. No records were changed.');
    } finally {
      setBusy(false);
    }
  };

  const fieldPreview = entity.fields.filter(f => mapping[f.key]).slice(0, 4);

  return (
    <Modal
      isOpen={isOpen}
      onClose={close}
      title={`Import ${entity.label}`}
      size="lg"
      footer={
        <>
          {step === 1 && (
            <>
              <button className="btn-secondary" onClick={() => { setStep(0); setParsed(null); setFile(null); }}><ArrowLeft size={14} /> Back</button>
              <button className="btn-primary" disabled={missingRequired.length > 0} onClick={() => setStep(2)}>Review rows</button>
            </>
          )}
          {step === 2 && (
            <>
              <button className="btn-secondary" onClick={() => setStep(1)} disabled={busy}><ArrowLeft size={14} /> Back</button>
              <button className="btn-primary" disabled={!canImport || busy} onClick={handleImport}>
                {busy && <Loader2 size={14} className="animate-spin" aria-hidden="true" />}
                Import {actionable} {actionable === 1 ? 'row' : 'rows'}
              </button>
            </>
          )}
          {step === 3 && (
            <>
              <button className="btn-secondary" onClick={reset}>Import another file</button>
              <button className="btn-primary" onClick={close}>Done</button>
            </>
          )}
          {step === 0 && <button className="btn-secondary" onClick={close}>Cancel</button>}
        </>
      }
    >
      <ol className="flex items-center gap-2 mb-5 text-[11px] font-semibold" aria-label="Import progress">
        {STEPS.map((s, i) => (
          <li key={s} className={`flex items-center gap-1.5 ${i === step ? 'text-primary' : i < step ? 'text-gray-600' : 'text-gray-400'}`} aria-current={i === step ? 'step' : undefined}>
            <span className={`grid place-items-center w-5 h-5 rounded-full text-[10px] ${i <= step ? 'bg-primary text-white' : 'bg-gray-100'}`}>{i + 1}</span>
            <span className="hidden sm:inline">{s}</span>
            {i < STEPS.length - 1 && <span className="w-4 h-px bg-gray-200" aria-hidden="true" />}
          </li>
        ))}
      </ol>

      {error && (
        <div role="alert" className="flex items-start gap-2 p-3 mb-4 rounded-lg bg-danger-50 text-danger-600 text-sm">
          <AlertTriangle size={16} className="shrink-0 mt-0.5" aria-hidden="true" /> {error}
        </div>
      )}

      {step === 0 && (
        <div className="space-y-4">
          <div
            onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
            onDragLeave={() => setDragActive(false)}
            onDrop={(e) => { e.preventDefault(); setDragActive(false); handleFile(e.dataTransfer.files?.[0]); }}
            className={`flex flex-col items-center justify-center gap-2 p-8 rounded-xl border-2 border-dashed text-center transition-colors ${dragActive ? 'border-primary bg-primary/5' : 'border-gray-300 bg-gray-50'}`}
          >
            {busy ? <Loader2 size={28} className="text-primary animate-spin" aria-hidden="true" /> : <UploadCloud size={28} className="text-primary" aria-hidden="true" />}
            <p className="text-sm text-gray-900">
              Drag &amp; drop a file here or{' '}
              <button type="button" className="text-primary font-semibold hover:underline" onClick={() => inputRef.current?.click()}>browse to upload</button>
            </p>
            <p className="text-xs text-gray-500">Supports CSV, XLSX, JSON · max 10 MB</p>
            <input
              ref={inputRef}
              type="file"
              accept={IMPORT_EXTENSIONS.map(e => `.${e}`).join(',')}
              className="sr-only"
              aria-label="Choose file to import"
              onChange={(e) => { handleFile(e.target.files?.[0]); e.target.value = ''; }}
            />
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-gray-600">
            <span className="font-medium">Download template:</span>
            {['csv', 'xlsx', 'json'].map(fmt => (
              <button key={fmt} type="button" className="btn-outline btn-xs" onClick={() => downloadTemplate(entity, fmt)}>
                <Download size={12} aria-hidden="true" /> {fmt.toUpperCase()}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-500">
            Required columns: {entity.fields.filter(f => f.required).map(f => f.label).join(', ')}.
            Duplicates are detected by {entity.dedupeKeys.map(k => k.map(key => entity.fields.find(f => f.key === key)?.label || key).join(' + ')).join(' or ')}.
          </p>
        </div>
      )}

      {step === 1 && parsed && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-gray-900">
            <FileText size={16} className="text-primary" aria-hidden="true" />
            <span className="font-medium truncate">{file?.name}</span>
            <span className="text-xs text-gray-500">· {parsed.rows.length} rows · {parsed.columns.length} columns</span>
          </div>
          <p className="text-xs text-gray-500">Match each field to a column in your file. Columns were matched automatically where the names agree.</p>
          <div className="border border-gray-200 rounded-lg divide-y divide-gray-100">
            {entity.fields.map(f => (
              <div key={f.key} className="grid grid-cols-1 sm:grid-cols-2 gap-2 items-center px-3 py-2">
                <label htmlFor={`map-${f.key}`} className="text-sm text-gray-900">
                  {f.label}{f.required && <span className="text-danger" aria-label="required"> *</span>}
                  {f.type === 'enum' && <span className="block text-[10px] text-gray-500">{f.options.join(' / ')}</span>}
                </label>
                <select
                  id={`map-${f.key}`}
                  className={`form-select text-sm ${f.required && !mapping[f.key] ? '!border-danger' : ''}`}
                  value={mapping[f.key] || ''}
                  onChange={(e) => setMapping(m => ({ ...m, [f.key]: e.target.value }))}
                >
                  <option value="">— Not imported —</option>
                  {parsed.columns.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            ))}
          </div>
          {missingRequired.length > 0 && (
            <p className="form-error" role="alert">Map the required field(s): {missingRequired.map(f => f.label).join(', ')}.</p>
          )}
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-3 rounded-lg bg-primary-50"><p className="text-lg font-bold text-primary">{counts.valid}</p><p className="text-[11px] text-gray-600">New records</p></div>
            <div className="p-3 rounded-lg bg-accent-50"><p className="text-lg font-bold text-accent-600">{counts.duplicates}</p><p className="text-[11px] text-gray-600">Match existing</p></div>
            <div className="p-3 rounded-lg bg-danger-50"><p className="text-lg font-bold text-danger-600">{counts.errors}</p><p className="text-[11px] text-gray-600">Rows with errors</p></div>
          </div>

          {counts.duplicates > 0 && (
            <fieldset className="p-3 rounded-lg border border-gray-200 space-y-2">
              <legend className="px-1 text-xs font-semibold text-gray-900">Rows that match existing records</legend>
              <label className="flex items-center gap-2 text-sm">
                <input type="radio" name="dup-mode" checked={mode === 'skip'} onChange={() => { setMode('skip'); setConfirmUpdate(false); }} className="accent-[#187f65]" />
                Skip duplicate entries (recommended)
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="radio" name="dup-mode" checked={mode === 'update'} onChange={() => setMode('update')} className="accent-[#187f65]" />
                Update existing records with values from the file
              </label>
              {mode === 'update' && (
                <label className="flex items-start gap-2 text-xs text-danger-600 bg-danger-50 p-2 rounded-md">
                  <input type="checkbox" checked={confirmUpdate} onChange={(e) => setConfirmUpdate(e.target.checked)} className="mt-0.5 accent-[#d0504c]" />
                  I understand {counts.duplicates} existing record(s) will be overwritten by mapped values from this file.
                </label>
              )}
            </fieldset>
          )}

          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="table-container max-h-72 overflow-y-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Row</th>
                    <th>Status</th>
                    {fieldPreview.map(f => <th key={f.key}>{f.label}</th>)}
                    <th>Issues</th>
                  </tr>
                </thead>
                <tbody>
                  {validated.slice(0, 100).map(r => (
                    <tr key={r.rowNumber}>
                      <td className="text-xs text-gray-500">{r.rowNumber}</td>
                      <td>
                        {r.errors.length ? <span className="badge-danger">Error</span> : r.duplicateOf ? <span className="badge-warning inline-flex items-center gap-1"><Copy size={10} aria-hidden="true" />Duplicate</span> : <span className="badge-success">New</span>}
                      </td>
                      {fieldPreview.map(f => <td key={f.key} className="text-xs max-w-[160px] truncate">{Array.isArray(r.data[f.key]) ? r.data[f.key].join(', ') : String(r.data[f.key] ?? '')}</td>)}
                      <td className="text-xs text-danger-600 whitespace-normal min-w-[180px]">{r.errors.join('; ')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {validated.length > 100 && <p className="text-[11px] text-gray-500 px-3 py-2 border-t border-gray-100">Showing first 100 of {validated.length} rows.</p>}
          </div>

          {counts.errors > 0 && (
            <button type="button" className="btn-outline btn-sm" onClick={() => downloadErrorReport(validated, entity.type)}>
              <Download size={13} aria-hidden="true" /> Download error report
            </button>
          )}
          {actionable === 0 && <p className="text-xs text-gray-500">There are no rows to import with the current settings.</p>}
        </div>
      )}

      {step === 3 && result && (
        <div className="text-center py-4 space-y-3">
          <CheckCircle2 size={36} className="mx-auto text-primary" aria-hidden="true" />
          <h3 className="text-base font-semibold text-gray-900">Import complete</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
            <div className="p-2 rounded-lg bg-gray-50"><p className="font-bold text-primary">{result.created}</p><p className="text-[11px] text-gray-500">Created</p></div>
            <div className="p-2 rounded-lg bg-gray-50"><p className="font-bold text-info">{result.updated}</p><p className="text-[11px] text-gray-500">Updated</p></div>
            <div className="p-2 rounded-lg bg-gray-50"><p className="font-bold text-accent-600">{result.skipped}</p><p className="text-[11px] text-gray-500">Skipped</p></div>
            <div className="p-2 rounded-lg bg-gray-50"><p className="font-bold text-danger">{result.failed}</p><p className="text-[11px] text-gray-500">Failed</p></div>
          </div>
          {result.failed > 0 && (
            <button type="button" className="btn-outline btn-sm" onClick={() => downloadErrorReport(validated, entity.type)}>
              <Download size={13} aria-hidden="true" /> Download error report
            </button>
          )}
          <p className="text-xs text-gray-500">Records were saved to this browser’s local storage.</p>
        </div>
      )}
    </Modal>
  );
}
