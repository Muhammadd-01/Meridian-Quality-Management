export function exportToCSV(data, filename, columns) {
  if (!data || data.length === 0) return;

  const headers = columns.map(c => c.label || c.key);
  const rows = data.map(row =>
    columns.map(c => {
      const val = c.accessor ? c.accessor(row) : row[c.key];
      const str = String(val ?? '');
      return str.includes(',') || str.includes('"') || str.includes('\n')
        ? `"${str.replace(/"/g, '""')}"`
        : str;
    })
  );

  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
