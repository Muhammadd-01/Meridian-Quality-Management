import React, { useEffect, useState } from 'react';
import { FileSpreadsheet, FileText, FileJson, Printer, Loader2 } from 'lucide-react';
import Modal from '../ui/Modal';
import { useToast } from '../ui/Toast';
import { exportRecords } from '../../utils/dataTransfer';
import { logEvent } from '../../lib/auditLog';

const FORMATS = [
  { id: 'csv', label: 'CSV', icon: FileText, hint: 'Spreadsheet-compatible text' },
  { id: 'xlsx', label: 'Excel', icon: FileSpreadsheet, hint: '.xlsx workbook' },
  { id: 'pdf', label: 'PDF', icon: Printer, hint: 'Print dialog → Save as PDF' },
  { id: 'json', label: 'JSON', icon: FileJson, hint: 'Structured data' },
];

/**
 * Export dialog: choose format and scope (all / current filtered view / selected rows).
 * Exports exactly the records passed in — callers pass the user's own accessible data.
 */
export default function ExportDialog({
  isOpen,
  onClose,
  title,
  filename,
  fields,
  allRecords = [],
  filteredRecords,
  selectedRecords,
  entityType,
  formats = ['csv', 'xlsx', 'pdf', 'json'],
}) {
  const addToast = useToast();
  const [format, setFormat] = useState(formats[0]);
  const [scope, setScope] = useState('filtered');
  const [busy, setBusy] = useState(false);

  const hasFiltered = Array.isArray(filteredRecords);
  const selectedCount = selectedRecords?.length || 0;

  useEffect(() => {
    if (!isOpen) return;
    setScope(selectedCount > 0 ? 'selected' : hasFiltered ? 'filtered' : 'all');
  }, [isOpen, selectedCount, hasFiltered]);

  const scopes = [
    { id: 'all', label: 'All records', count: allRecords.length },
    hasFiltered && { id: 'filtered', label: 'Current filtered view', count: filteredRecords.length },
    selectedRecords && { id: 'selected', label: 'Selected rows only', count: selectedCount },
  ].filter(Boolean);

  const dataset = scope === 'selected' ? selectedRecords || [] : scope === 'filtered' && hasFiltered ? filteredRecords : allRecords;

  const handleExport = () => {
    setBusy(true);
    try {
      const result = exportRecords({ records: dataset, fields, format, filename, title });
      logEvent({ action: 'exported', entityType, details: `${result.count} rows as ${format.toUpperCase()} (${scopes.find(s => s.id === scope)?.label.toLowerCase()})` });
      addToast(format === 'pdf'
        ? `Print view opened with ${result.count} records — choose “Save as PDF”.`
        : `Exported ${result.count} records to ${result.filename}.`, 'success', 4000);
      onClose();
    } catch (err) {
      addToast(err.message || 'Export failed.', 'error', 5000);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Export ${title}`}
      size="md"
      footer={
        <>
          <button className="btn-secondary" onClick={onClose} disabled={busy}>Cancel</button>
          <button className="btn-primary" onClick={handleExport} disabled={busy || dataset.length === 0}>
            {busy && <Loader2 size={14} className="animate-spin" aria-hidden="true" />}
            Export {dataset.length} {dataset.length === 1 ? 'record' : 'records'}
          </button>
        </>
      }
    >
      <div className="space-y-5">
        <fieldset>
          <legend className="form-label">Format</legend>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {FORMATS.filter(f => formats.includes(f.id)).map(f => {
              const Icon = f.icon;
              const active = format === f.id;
              return (
                <label
                  key={f.id}
                  className={`flex flex-col items-center gap-1 p-3 rounded-lg border cursor-pointer text-center transition-colors ${active ? 'border-primary bg-primary/5 text-primary' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                >
                  <input type="radio" name="export-format" value={f.id} checked={active} onChange={() => setFormat(f.id)} className="sr-only" />
                  <Icon size={18} aria-hidden="true" />
                  <span className="text-xs font-semibold">{f.label}</span>
                  <span className="text-[10px] text-gray-500 leading-tight">{f.hint}</span>
                </label>
              );
            })}
          </div>
        </fieldset>

        <fieldset>
          <legend className="form-label">Scope</legend>
          <div className="space-y-2">
            {scopes.map(s => (
              <label key={s.id} className={`flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg border cursor-pointer ${scope === s.id ? 'border-primary bg-primary/5' : 'border-gray-200 hover:bg-gray-50'} ${s.count === 0 ? 'opacity-50' : ''}`}>
                <span className="flex items-center gap-2.5 text-sm text-gray-900">
                  <input
                    type="radio"
                    name="export-scope"
                    value={s.id}
                    checked={scope === s.id}
                    disabled={s.count === 0}
                    onChange={() => setScope(s.id)}
                    className="accent-[#2C5F6F]"
                  />
                  {s.label}
                </span>
                <span className="badge-secondary">{s.count}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <p className="text-xs text-gray-500">
          Columns: {fields.map(f => f.label).join(', ')}.
        </p>
      </div>
    </Modal>
  );
}
