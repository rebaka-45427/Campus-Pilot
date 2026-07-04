import React from 'react';
import { cn } from '../utils/cn';

export default function Card({ children, className, hover = false, ...props }) {
  return (
    <div 
      className={cn(
        "bg-white rounded-xl shadow-soft p-6 border border-gray-100 transition-all duration-300",
        hover && "hover:shadow-md hover:-translate-y-1 hover:border-gray-200 cursor-pointer",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
