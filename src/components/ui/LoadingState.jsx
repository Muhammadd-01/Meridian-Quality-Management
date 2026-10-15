import React from 'react';

export default function LoadingState({ text = 'Loading...' }) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="w-8 h-8 border-3 border-gray-200 border-t-primary rounded-full animate-spin mb-3" />
      <p className="text-sm text-gray-500">{text}</p>
    </div>
  );
}
