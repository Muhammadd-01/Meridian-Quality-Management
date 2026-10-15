import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

export default function StatCard({ title, value, change, changeType = 'increase', icon: Icon, iconColor = 'bg-primary/10 text-primary', subtitle }) {
  return (
    <div className="card card-body flex flex-col">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{title}</p>
          <h3 className="text-2xl font-bold text-gray-800 mt-1.5">{value}</h3>
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
          <div className={`grid place-items-center w-11 h-11 rounded-xl ${iconColor}`}>
            <Icon size={20} />
          </div>
        )}
      </div>
    </div>
  );
}
