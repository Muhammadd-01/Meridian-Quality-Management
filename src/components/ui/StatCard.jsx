import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import AnimatedCounter from './AnimatedCounter';

export default function StatCard({ title, value, change, changeType = 'increase', icon: Icon, iconColor = 'bg-primary/10 text-primary', subtitle }) {
  // Check if value is numeric or formatted string
  const renderValue = () => {
    if (typeof value === 'number') {
      return <AnimatedCounter value={value} />;
    }
    if (typeof value === 'string') {
      // Check if it starts with currency or prefix
      const matches = value.match(/^([^\d]*)([\d,.]+)(.*)$/);
      if (matches) {
        const prefix = matches[1];
        const num = parseFloat(matches[2].replace(/,/g, ''));
        const suffix = matches[3];
        const hasDecimals = matches[2].includes('.');
        const decimals = hasDecimals ? matches[2].split('.')[1].length : 0;
        return (
          <AnimatedCounter
            value={num}
            prefix={prefix}
            suffix={suffix}
            decimals={decimals}
          />
        );
      }
    }
    return value;
  };

  return (
    <div className="card card-body flex flex-col hover:shadow-card-hover transition-all duration-300">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{title}</p>
          <h3 className="text-2xl font-bold text-gray-800 mt-1.5">{renderValue()}</h3>
          {change !== undefined && (
            <div className="flex items-center gap-1.5 mt-2">
              {changeType === 'increase' ? (
                <span className="inline-flex items-center gap-0.5 text-xs font-medium text-success">
                  <TrendingUp size={12} /> {change}
                </span>
              ) : (
                <span className="inline-flex items-center gap-0.5 text-xs font-medium text-danger">
                  <TrendingDown size={12} /> {change}
                </span>
              )}
              {subtitle && <span className="text-xs text-gray-400">{subtitle}</span>}
            </div>
          )}
          {!change && subtitle && <p className="text-xs text-gray-400 mt-1.5">{subtitle}</p>}
        </div>
        {Icon && (
          <div className={`grid place-items-center w-11 h-11 rounded-xl ${iconColor} transition-transform duration-300 hover:scale-110`}>
            <Icon size={20} />
          </div>
        )}
      </div>
    </div>
  );
}
