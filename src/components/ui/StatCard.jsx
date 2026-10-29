import React from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import AnimatedCounter from './AnimatedCounter';
import InfoTip from './InfoTip';

/**
 * KPI card. Optional props:
 *  - info: explanation of how the metric is calculated (shown as a tooltip)
 *  - to: route to open when the card is clicked (filtered report / module)
 *  - changeType: 'increase' | 'decrease' | 'neutral'
 *  - positiveIsGood: set false for metrics where a rise is bad (e.g. bounce rate)
 */
// KPI icon tone, read from the colour classes a page passes in.
const TONES = [
  [/primrose/, 'primrose'],
  [/accent|orange/, 'accent'],
  [/success|green|emerald|teal|lime/, 'success'],
  [/warning|amber|yellow/, 'warning'],
  [/danger|red|rose/, 'danger'],
  [/violet|purple|indigo|fuchsia|pink/, 'violet'],
  [/info|blue|sky|cyan/, 'info'],
];
const toneOf = (classes = '') => TONES.find(([re]) => re.test(classes))?.[1] || 'primary';

export default function StatCard({ title, value, change, changeType = 'increase', icon: Icon, iconColor = 'bg-primary/10 text-primary', subtitle, info, to, positiveIsGood = true, footer }) {
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

  const good = changeType === 'neutral' ? null : (changeType === 'increase') === positiveIsGood;
  const changeColor = good === null ? 'text-gray-500' : good ? 'text-success' : 'text-danger';
  const ChangeIcon = changeType === 'neutral' ? Minus : changeType === 'increase' ? TrendingUp : TrendingDown;

  const body = (
    <div className="relative">
      <div className="min-w-0">
        <p className={`text-[13px] font-medium text-gray-500 flex items-center gap-1 min-h-[2.75rem] ${Icon ? 'pr-14' : ''}`}>
          {title}
          {info && <InfoTip text={info} />}
        </p>
        <h3 className="font-display text-[clamp(1.25rem,0.95rem+0.9vw,1.875rem)] leading-tight font-extrabold tracking-tight text-gray-900 mt-1 tabular-nums">{renderValue()}</h3>
        {change !== undefined && change !== null && change !== '' && (
          <div className="flex items-center gap-1.5 mt-2 flex-wrap">
            <span className={`inline-flex items-center gap-0.5 text-xs font-semibold px-2 py-0.5 rounded-full ${good === null ? 'bg-gray-100' : good ? 'bg-success-50' : 'bg-danger-50'} ${changeColor}`}>
              <ChangeIcon size={12} aria-hidden="true" />
              <span className="sr-only">{changeType === 'increase' ? 'Up' : changeType === 'decrease' ? 'Down' : 'No change'} </span>
              {change}
            </span>
            {subtitle && <span className="text-xs text-gray-400">{subtitle}</span>}
          </div>
        )}
        {!change && subtitle && <p className="text-xs text-gray-400 mt-1.5">{subtitle}</p>}
        {footer}
      </div>
      {Icon && (
        <div className={`kpi-icon ${toneOf(iconColor)} absolute top-0 right-0`} aria-hidden="true">
          <Icon size={19} />
        </div>
      )}
    </div>
  );

  const className = 'card card-lift card-body flex flex-col relative overflow-hidden group';

  if (to) {
    return (
      <Link to={to} className={`${className} card-interactive focus-visible:outline-none`} aria-label={`${title}: open details`}>
        {body}
      </Link>
    );
  }

  return <div className={className}>{body}</div>;
}
