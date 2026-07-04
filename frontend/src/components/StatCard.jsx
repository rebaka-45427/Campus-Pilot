import React from 'react';
import Card from './Card';
import { cn } from '../utils/cn';

export default function StatCard({ title, value, icon: Icon, trend, trendUp, color = 'primary' }) {
  const colorMap = {
    primary: 'bg-primary/10 text-primary',
    success: 'bg-success/10 text-success',
    warning: 'bg-warning/10 text-warning',
    danger: 'bg-danger/10 text-danger',
    gray: 'bg-gray-100 text-gray-600',
  };

  return (
    <Card hover className="flex flex-col">
      <div className="flex justify-between items-start mb-4">
        <div className={cn("p-3 rounded-2xl", colorMap[color])}>
          <Icon size={24} />
        </div>
        {trend && (
          <span className={cn(
            "text-sm font-bold flex items-center px-2 py-1 rounded-full",
            trendUp ? "text-success bg-success/10" : "text-danger bg-danger/10"
          )}>
            {trendUp ? '↑' : '↓'} {trend}
          </span>
        )}
      </div>
      <div>
        <h3 className="text-gray-500 text-sm font-medium">{title}</h3>
        <p className="text-3xl font-black text-gray-900 mt-1">{value}</p>
      </div>
    </Card>
  );
}
