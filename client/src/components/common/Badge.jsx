import React from 'react';

const Badge = ({ children, variant = 'default', size = 'md', className = '' }) => {
  const variantStyles = {
    default: 'bg-canvasd text-ink-700 border-line',
    primary: 'bg-ink-900 text-canvas border-ink-900',
    success: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    warning: 'bg-amber-50 text-amber-800 border-amber-200',
    danger: 'bg-clay-50 text-clay-700 border-clay-100',
    info: 'bg-canvasd text-ink-700 border-line',
    dark: 'bg-ink-900 text-canvas border-ink-900'
  };

  const sizeStyles = {
    sm: 'text-[10px] px-2 py-0.5 tracking-wider font-semibold',
    md: 'text-xs px-2.5 py-1 tracking-wide font-medium',
    lg: 'text-sm px-3.5 py-1.5 font-semibold'
  };

  return (
    <span
      className={`inline-flex items-center justify-center border uppercase tracking-wide ${
        variantStyles[variant] || variantStyles.default
      } ${sizeStyles[size] || sizeStyles.md} ${className}`}
    >
      {children}
    </span>
  );
};

export default Badge;
