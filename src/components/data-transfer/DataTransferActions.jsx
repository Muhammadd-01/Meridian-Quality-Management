import React, { useState } from 'react';
import { Download, Upload } from 'lucide-react';
import { ENTITIES } from '../../data/entities';
import ExportDialog from './ExportDialog';
import ImportDialog from './ImportDialog';

/**
 * Drop-in Import / Export buttons for a module page.
 *  - records / setRecords: the page's own collection state (from useLocalStorage)
 *  - filtered: the records currently shown after search & filters (optional)
 *  - selected: explicitly selected rows (optional)
 */
export default function DataTransferActions({ entityType, records, setRecords, filtered, selected, exportFields, exportOnly = false }) {
  const entity = ENTITIES[entityType];
  const [exportOpen, setExportOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const canImport = !exportOnly && entity.importable !== false && typeof setRecords === 'function';

  return (
    <>
      {canImport && (
        <button type="button" onClick={() => setImportOpen(true)} className="btn-outline btn-sm">
          <Upload size={14} aria-hidden="true" /> Import
        </button>
      )}
      <button type="button" onClick={() => setExportOpen(true)} className="btn-outline btn-sm">
        <Download size={14} aria-hidden="true" /> Export
      </button>

      <ExportDialog
        isOpen={exportOpen}
        onClose={() => setExportOpen(false)}
        title={entity.label}
        filename={`meridian_${entity.type}`}
        fields={exportFields || entity.fields}
        allRecords={records}
        filteredRecords={filtered}
        selectedRecords={selected}
        entityType={entity.type}
      />
      {canImport && (
        <ImportDialog
          isOpen={importOpen}
          onClose={() => setImportOpen(false)}
          entity={entity}
          records={records}
          setRecords={setRecords}
        />
      )}
    </>
  );
}
