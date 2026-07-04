import React from 'react';
import { cn } from '../utils/cn';

export default function Badge({ children, className, variant = 'primary' }) {
  const variants = {
    primary: "bg-primary/10 text-primary",
    success: "bg-success/10 text-success",
    warning: "bg-warning/10 text-warning",
    danger: "bg-danger/10 text-danger",
    gray: "bg-gray-100 text-gray-700",
  };

  return (
    <span className={cn("px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider", variants[variant], className)}>
      {children}
    </span>
  );
}
