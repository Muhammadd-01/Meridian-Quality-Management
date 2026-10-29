import * as XLSX from 'xlsx';

// Supported project export columns
export const PROJECT_COLUMNS = [
  { key: 'name', label: 'Project Name' },
  { key: 'company', label: 'Client / Company' },
  { key: 'status', label: 'Status' },
  { key: 'priority', label: 'Priority' },
  { key: 'lead', label: 'Project Lead' },
  { key: 'completedTasks', label: 'Completed Tasks' },
  { key: 'totalTasks', label: 'Total Tasks' },
  { key: 'spent', label: 'Budget Spent ($)' },
  { key: 'budget', label: 'Total Budget ($)' },
  { key: 'dueDate', label: 'Due Date' },
  { key: 'description', label: 'Description' },
];

/**
 * Export projects to CSV
 */
export function exportProjectsToCSV(projects, filename = 'meridian-projects') {
  if (!projects || projects.length === 0) return false;

  const headers = PROJECT_COLUMNS.map(c => c.label);
  const rows = projects.map(p =>
    PROJECT_COLUMNS.map(c => {
      const val = p[c.key] ?? p[c.key === 'lead' ? 'manager' : c.key] ?? '';
      const str = String(val);
      return str.includes(',') || str.includes('"') || str.includes('\n')
        ? `"${str.replace(/"/g, '""')}"`
        : str;
    })
  );

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  triggerDownload(blob, `${filename}.csv`);
  return true;
}

/**
 * Export projects to Excel (.xlsx) using xlsx library
 */
export function exportProjectsToExcel(projects, filename = 'meridian-projects') {
  if (!projects || projects.length === 0) return false;

  const data = projects.map(p => ({
    'Project Name': p.name || '',
    'Client / Company': p.company || p.client || '',
    'Status': p.status || '',
    'Priority': p.priority || '',
    'Project Lead': p.lead || p.manager || '',
    'Completed Tasks': p.completedTasks || 0,
    'Total Tasks': p.totalTasks || 0,
    'Budget Spent ($)': p.spent || 0,
    'Total Budget ($)': p.budget || 0,
    'Due Date': p.dueDate || '',
    'Description': p.description || '',
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Projects');

  // Generate buffer and trigger download
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  triggerDownload(blob, `${filename}.xlsx`);
  return true;
}

/**
 * Export projects to JSON
 */
export function exportProjectsToJSON(projects, filename = 'meridian-projects') {
  if (!projects || projects.length === 0) return false;

  const cleanData = projects.map(p => ({
    id: p.id,
    name: p.name,
    company: p.company || p.client,
    priority: p.priority,
    status: p.status,
    completedTasks: p.completedTasks || 0,
    totalTasks: p.totalTasks || 0,
    spent: p.spent || 0,
    budget: p.budget || 0,
    lead: p.lead || p.manager,
    dueDate: p.dueDate,
    description: p.description || '',
    progress: p.progress,
  }));

  const jsonStr = JSON.stringify(cleanData, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  triggerDownload(blob, `${filename}.json`);
  return true;
}

/**
 * Export projects to printable PDF via formatted print window
 */
export function exportProjectsToPDF(projects, filename = 'meridian-projects') {
  if (!projects || projects.length === 0) return false;

  const printWindow = window.open('', '_blank');
  if (!printWindow) return false;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>${filename}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 24px; color: #102C32; }
          h1 { font-size: 20px; font-weight: bold; margin-bottom: 4px; color: #093F50; }
          p.meta { font-size: 12px; color: #52676A; margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; font-size: 11px; }
          th { background: #F5F3EC; color: #52676A; text-align: left; padding: 8px 10px; border-bottom: 2px solid #C9D9D8; text-transform: uppercase; }
          td { padding: 8px 10px; border-bottom: 1px solid #DFE7E3; }
          tr:nth-child(even) { background-color: #FBF8E8; }
          .badge { display: inline-block; padding: 2px 6px; border-radius: 4px; font-weight: 600; font-size: 10px; }
          .badge-high { background: #FBEEEC; color: #B83A2C; }
          .badge-med { background: #FDF1DD; color: #A45B0B; }
          .badge-low { background: #E2EDEC; color: #093F50; }
          @media print {
            body { padding: 0; }
            button { display: none; }
          }
        </style>
      </head>
      <body>
        <h1>Meridian Quality Management — Projects Report</h1>
        <p class="meta">Exported on ${new Date().toLocaleDateString()} &middot; ${projects.length} records</p>
        <table>
          <thead>
            <tr>
              <th>Project Name</th>
              <th>Client / Company</th>
              <th>Status</th>
              <th>Priority</th>
              <th>Lead</th>
              <th>Tasks</th>
              <th>Budget Spent</th>
              <th>Total Budget</th>
              <th>Due Date</th>
            </tr>
          </thead>
          <tbody>
            ${projects.map(p => `
              <tr>
                <td><strong>${p.name}</strong></td>
                <td>${p.company || p.client || '—'}</td>
                <td>${p.status}</td>
                <td><span class="badge ${p.priority === 'High' ? 'badge-high' : p.priority === 'Medium' ? 'badge-med' : 'badge-low'}">${p.priority}</span></td>
                <td>${p.lead || p.manager || '—'}</td>
                <td>${p.completedTasks || 0} / ${p.totalTasks || 0}</td>
                <td>$${Number(p.spent || 0).toLocaleString()}</td>
                <td>$${Number(p.budget || 0).toLocaleString()}</td>
                <td>${p.dueDate || '—'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <script>
          window.onload = function() { window.print(); }
        </script>
      </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
  return true;
}

/**
 * Trigger file download and clean up object URL
 */
function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

/**
 * Download sample template for project imports
 */
export function downloadImportTemplate(format = 'csv') {
  const sample = [
    {
      'Project Name': 'Cloud Security Audit',
      'Client / Company': 'Acme Global',
      'Priority': 'High',
      'Status': 'In Progress',
      'Project Lead': 'Aisha Rahman',
      'Due Date': '2026-12-15',
      'Total Budget ($)': 150000,
      'Budget Spent ($)': 45000,
      'Total Tasks': 20,
      'Completed Tasks': 8,
      'Description': 'Comprehensive ISO 27001 cloud security compliance audit',
    },
    {
      'Project Name': 'Supplier Quality Matrix',
      'Client / Company': 'Vantage Retail',
      'Priority': 'Medium',
      'Status': 'On Track',
      'Project Lead': 'Owen Ng',
      'Due Date': '2026-11-01',
      'Total Budget ($)': 85000,
      'Budget Spent ($)': 35000,
      'Total Tasks': 15,
      'Completed Tasks': 10,
      'Description': 'Supplier scorecard evaluation and SLA tracking portal',
    },
  ];

  if (format === 'json') {
    const jsonStr = JSON.stringify(sample, null, 2);
    triggerDownload(new Blob([jsonStr], { type: 'application/json' }), 'projects_import_template.json');
  } else if (format === 'xlsx') {
    const ws = XLSX.utils.json_to_sheet(sample);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template');
    const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    triggerDownload(new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), 'projects_import_template.xlsx');
  } else {
    const headers = Object.keys(sample[0]);
    const rows = sample.map(item => headers.map(h => `"${String(item[h]).replace(/"/g, '""')}"`).join(','));
    const csv = [headers.join(','), ...rows].join('\n');
    triggerDownload(new Blob([csv], { type: 'text/csv;charset=utf-8;' }), 'projects_import_template.csv');
  }
}

/**
 * Parse and validate uploaded file for project import
 * Supports CSV, XLSX, JSON
 */
export async function parseImportFile(file) {
  if (!file) throw new Error('No file selected.');
  if (file.size > 10 * 1024 * 1024) throw new Error('File exceeds 10 MB limit.');

  const ext = file.name.split('.').pop()?.toLowerCase();
  let rawRows = [];

  if (ext === 'json') {
    const text = await file.text();
    const parsed = JSON.parse(text);
    rawRows = Array.isArray(parsed) ? parsed : [parsed];
  } else if (ext === 'xlsx' || ext === 'xls') {
    const buffer = await file.arrayBuffer();
    const wb = XLSX.read(buffer, { type: 'array' });
    const firstSheet = wb.Sheets[wb.SheetNames[0]];
    rawRows = XLSX.utils.sheet_to_json(firstSheet);
  } else if (ext === 'csv') {
    const text = await file.text();
    const wb = XLSX.read(text, { type: 'string' });
    const firstSheet = wb.Sheets[wb.SheetNames[0]];
    rawRows = XLSX.utils.sheet_to_json(firstSheet);
  } else {
    throw new Error('Unsupported format. Please upload .csv, .xlsx, or .json.');
  }

  // Validate and normalize rows
  const validRows = [];
  const errors = [];

  rawRows.forEach((row, idx) => {
    const rowNum = idx + 2; // considering 1-based header row
    const name = row['Project Name'] || row.name || row.projectName;
    const company = row['Client / Company'] || row.company || row.client;
    const priority = row['Priority'] || row.priority || 'Medium';
    const status = row['Status'] || row.status || 'In Progress';
    const lead = row['Project Lead'] || row.lead || row.manager || 'Unassigned';
    const dueDate = row['Due Date'] || row.dueDate || '';
    const totalBudget = Number(row['Total Budget ($)'] ?? row.budget ?? row.totalBudget ?? 0);
    const spent = Number(row['Budget Spent ($)'] ?? row.spent ?? 0);
    const totalTasks = Number(row['Total Tasks'] ?? row.totalTasks ?? 10);
    const completedTasks = Number(row['Completed Tasks'] ?? row.completedTasks ?? 0);
    const description = row['Description'] || row.description || '';

    if (!name || String(name).trim().length < 2) {
      errors.push({ row: rowNum, error: 'Missing or invalid Project Name' });
      return;
    }
    if (!company || String(company).trim().length < 2) {
      errors.push({ row: rowNum, error: 'Missing Client / Company' });
      return;
    }
    if (isNaN(totalBudget) || totalBudget < 0) {
      errors.push({ row: rowNum, error: 'Total Budget must be a non-negative number' });
      return;
    }

    const progress = totalTasks > 0 ? Math.min(100, Math.round((completedTasks / totalTasks) * 100)) : 0;

    validRows.push({
      id: `proj-import-${Date.now()}-${idx}`,
      name: String(name).trim(),
      company: String(company).trim(),
      client: String(company).trim(),
      priority: ['High', 'Medium', 'Low'].includes(priority) ? priority : 'Medium',
      status: ['In Progress', 'Delayed', 'On Track', 'Completed'].includes(status) ? status : 'In Progress',
      lead: String(lead).trim(),
      manager: String(lead).trim(),
      dueDate: dueDate || new Date(Date.now() + 60 * 86400000).toISOString().split('T')[0],
      budget: totalBudget,
      spent: isNaN(spent) ? 0 : spent,
      totalTasks: Math.max(1, totalTasks),
      completedTasks: Math.min(totalTasks, Math.max(0, completedTasks)),
      progress,
      description: String(description).trim(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  });

  return { validRows, errors, total: rawRows.length };
}
