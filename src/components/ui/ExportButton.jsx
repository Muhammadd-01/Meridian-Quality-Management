import React from 'react';
import { Download } from 'lucide-react';

export default function ExportButton({ onClick, label = 'Export CSV' }) {
  return (
    <button onClick={onClick} className="btn-outline btn-sm">
      <Download size={14} />
      {label}
    </button>
  );
}
