'use client';

import { type Part } from '@/lib/zustand';

interface StageHeaderProps {
  part: Part;
  topicId?: string;
}

export default function StageHeader({ part, topicId }: StageHeaderProps) {
  return (
    <div className="text-xl font-bold mb-4">
      Part {part} - Topic: {topicId || 'Loading...'}
    </div>
  );
}