import React from 'react';

export default function FilterDropdown({ label, value, onChange, options, className = '' }) {
  return (
    <div className={className}>
      {label && <label className="form-label">{label}</label>}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="form-select text-sm"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
