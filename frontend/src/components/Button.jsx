import React from 'react';
import { cn } from '../utils/cn';

export default function Button({ children, className, variant = 'primary', ...props }) {
  const baseStyles = "inline-flex items-center justify-center font-medium transition-all duration-200 rounded-xl px-5 py-2.5 outline-none";
  const variants = {
    primary: "bg-primary text-white hover:bg-primary/90 active:scale-95 shadow-soft hover:shadow-md",
    secondary: "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 active:scale-95",
    danger: "bg-danger text-white hover:bg-danger/90 active:scale-95 shadow-soft",
    ghost: "bg-transparent text-gray-600 hover:bg-gray-100 hover:text-gray-900",
  };

  return (
    <button 
      className={cn(baseStyles, variants[variant], className)}
      {...props}
    >
      {children}
    </button>
  );
}
