// frontend/src/app/history/page.tsx
'use client';
import { useEffect, useState } from 'react';

export default function History() {
  const [artifacts, setArtifacts] = useState<any[]>([]);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_BASE || 'http://127.0.0.1:8000'}/asr/artifacts`)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(setArtifacts)
      .catch(err => {
        console.error('Failed to load artifacts', err);
        setArtifacts([]);
      });
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-100 p-8">
      <h1 className="text-5xl font-bold text-center mb-12 text-indigo-700">Riwayat Jawaban</h1>
      <div className="max-w-4xl mx-auto space-y-6">
        {artifacts.map(a => (
          <div key={a.id} className="bg-white rounded-2xl shadow-xl p-8">
            <p className="text-sm text-gray-500 mb-4">{a.created_at} • WPM: {a.wpm}</p>
            <pre className="bg-gray-100 p-6 rounded-xl text-sm overflow-auto">
              {JSON.stringify(a.json_data, null, 2)}
            </pre>
          </div>
        ))}
        {artifacts.length === 0 && <p className="text-center text-gray-500">Belum ada riwayat.</p>}
      </div>
    </div>
  );
}
