'use client';

import { Card, CardContent } from '@/components/ui/card';

interface PromptCardProps {
  content: string | { title: string; bullets: string[] };
  type: 'question' | 'cue';
  onPrepDone?: () => void;
}

export default function PromptCard({ content, type, onPrepDone }: PromptCardProps) {
  if (type === 'question') {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-lg">{content as string}</p>
        </CardContent>
      </Card>
    );
  }

  if (type === 'cue' && typeof content === 'object' && content !== null && 'title' in content && 'bullets' in content) {
    const { title, bullets } = content;
    return (
      <Card>
        <CardContent className="p-6">
          <h3 className="text-xl font-bold mb-2">{title}</h3>
          <ul className="space-y-1">
            {bullets.map((bullet: string, i: number) => (
              <li key={i} className="list-disc ml-4">{bullet}</li>
            ))}
          </ul>
          {onPrepDone && (
            <button onClick={onPrepDone} className="mt-4 px-4 py-2 bg-blue-500 text-white rounded">
              Prep Done
            </button>
          )}
        </CardContent>
      </Card>
    );
  }

  return <div>Invalid content</div>;
}