import React, { useEffect, useState } from 'react';

export default function AnimatedCounter({
  value,
  duration = 1200,
  prefix = '',
  suffix = '',
  decimals = 0,
  formatter,
  className = '',
}) {
  // Extract number from value if value is a string with currency or percentage
  const parseNum = (val) => {
    if (typeof val === 'number') return val;
    if (!val) return 0;
    const str = String(val).replace(/[^0-9.-]+/g, '');
    const n = parseFloat(str);
    return isNaN(n) ? 0 : n;
  };

  const target = parseNum(value);
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let startTimestamp = null;
    const startVal = 0;

    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      // Ease out cubic
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const current = startVal + (target - startVal) * easeProgress;
      setDisplayValue(current);

      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        setDisplayValue(target);
      }
    };

    window.requestAnimationFrame(step);
  }, [target, duration]);

  if (formatter) {
    return <span className={className}>{formatter(displayValue)}</span>;
  }

  const formattedNum = decimals > 0
    ? displayValue.toFixed(decimals)
    : Math.round(displayValue).toLocaleString();

  return (
    <span className={className}>
      {prefix}
      {formattedNum}
      {suffix}
    </span>
  );
}
