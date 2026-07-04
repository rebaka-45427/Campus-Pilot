import React from 'react';
import { X } from 'lucide-react';
import { cn } from '../utils/cn';
import Card from './Card';

export default function Modal({ isOpen, onClose, title, children, className }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0">
      <div 
        className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      ></div>
      <Card className={cn("relative z-10 w-full max-w-lg p-0 overflow-hidden animate-fade-in shadow-2xl", className)}>
        <div className="flex justify-between items-center p-5 border-b border-gray-100 bg-gray-50/50">
          <h3 className="text-xl font-bold text-gray-900">{title}</h3>
          <button 
            onClick={onClose}
            className="p-2 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        <div className="p-6 max-h-[80vh] overflow-y-auto">
          {children}
        </div>
      </Card>
    </div>
  );
}
