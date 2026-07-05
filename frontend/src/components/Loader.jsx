import React from 'react';
import { Loader2 } from 'lucide-react';

export default function Loader({ text = "Loading...", fullScreen = false }) {
  const content = (
    <div className="flex flex-col items-center justify-center p-8 animate-fade-in">
      <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
      <p className="text-gray-500 font-medium">{text}</p>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        {content}
      </div>
    );
  }

  return (
    <div className="w-full h-full min-h-[200px] flex items-center justify-center">
      {content}
    </div>
  );
}
