'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getAnalyzeStatus } from '../../../lib/api';

interface Result {
  stage: string;
  progress: number;
  scoreGrammar?: number;  // Fix: Tambah property skor
  scoreVocab?: number;
  scoreFluency?: number;
  scoreCoherence?: number;
  overallScore?: number;
}

export default function ResultsPage({ params }: { params: { sessionId: string } }) {
  const searchParams = useSearchParams();
  const jobId = searchParams.get('jobId');
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (jobId) {
      getAnalyzeStatus(jobId).then((status: Result) => {
        setResult(status);
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, [jobId]);

  const saveHistory = async () => {
    await fetch('/api/history', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: params.sessionId,
        topic: 'travel',
        scoreGrammar: result?.scoreGrammar || 7.0,
        scoreVocab: result?.scoreVocab || 7.5,
        scoreFluency: result?.scoreFluency || 7.2,
        scoreCoherence: result?.scoreCoherence || 7.3,
        overallScore: result?.overallScore || 7.25,
      }),
    });
  };

  if (loading) return <div>Processing results...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-3xl font-bold mb-8">Hasil Latihan Speaking - Session {params.sessionId}</h1>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded">Grammar: {result?.scoreGrammar || 7.0}</div>
        <div className="bg-white p-4 rounded">Vocabulary: {result?.scoreVocab || 7.5}</div>
        <div className="bg-white p-4 rounded">Fluency: {result?.scoreFluency || 7.2}</div>
        <div className="bg-white p-4 rounded">Coherence: {result?.scoreCoherence || 7.3}</div>
      </div>
      <button onClick={saveHistory} className="mt-8 p-2 bg-green-500 text-white rounded">
        Simpan History
      </button>
    </div>
  );
}