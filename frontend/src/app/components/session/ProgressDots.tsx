'use client';

interface ProgressDotsProps {
  current: number;
  total: number;
}

export default function ProgressDots({ current, total }: ProgressDotsProps) {
  return (
    <div className="flex space-x-1 mb-4">
      {Array.from({ length: total }, (_, i) => (
        <div 
          key={i} 
          className={`w-3 h-3 rounded-full ${i < current ? 'bg-blue-500' : 'bg-gray-300'}`} 
        />
      ))}
    </div>
  );
}