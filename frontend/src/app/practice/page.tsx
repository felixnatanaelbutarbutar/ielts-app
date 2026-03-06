// src/app/practice/new/page.tsx
'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import { useSession } from 'next-auth/react';

interface Part1Question { id: string; question: string; }
interface Part2Data { id: string; cue_card: string; bullets: string[]; }
interface PracticeData { topic: string; part1: Part1Question[]; part2: Part2Data | null; }

export default function PracticePage() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const topicSlug = searchParams.get('topic');
  const [data, setData] = useState<PracticeData | null>(null);
  const [part, setPart] = useState<'intro' | 'part1' | 'prep' | 'part2' | 'followup'>('intro');
  const [questionIndex, setQuestionIndex] = useState(0);
  const [prepSeconds, setPrepSeconds] = useState(60);
  const [speakSeconds, setSpeakSeconds] = useState(120);
  const [isRecording, setIsRecording] = useState(false);
  const [part1Transcripts, setPart1Transcripts] = useState<string[]>([]);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const base = process.env.NEXT_PUBLIC_API_BASE || 'http://127.0.0.1:8000';

  useEffect(() => {
    if (topicSlug) {
      fetch(`${base}/topics/${topicSlug}/questions`)
        .then(r => r.ok ? r.json() : Promise.reject())
        .then((d: PracticeData) => setData(d))
        .catch(() => setData(null));
    }
  }, [topicSlug, base]);

  // initialize transcripts array when data loads
  useEffect(() => {
    if (data && data.part1) {
      setPart1Transcripts(Array(data.part1.length).fill(''));
    }
  }, [data]);

  // prep timer
  useEffect(() => {
    if (part === 'prep' && prepSeconds > 0) {
      const t = setTimeout(() => setPrepSeconds(s => s - 1), 1000);
      return () => clearTimeout(t);
    } else if (part === 'prep' && prepSeconds === 0) {
      setPart('part2');
      setSpeakSeconds(120);
      startRecordingPart2();
    }
  }, [part, prepSeconds]);

  // speak timer
  useEffect(() => {
    if (part === 'part2' && speakSeconds > 0) {
      const t = setTimeout(() => setSpeakSeconds(s => s - 1), 1000);
      return () => clearTimeout(t);
    } else if (part === 'part2' && speakSeconds === 0) {
      stopRecordingPart2();
    }
  }, [part, speakSeconds]);

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    // reset previous chunks
    audioChunksRef.current = [];
    const recorder = new MediaRecorder(stream);
    recorder.ondataavailable = e => {
      if (e.data && e.data.size > 0) audioChunksRef.current.push(e.data);
    };
    mediaRecorderRef.current = recorder;
    recorder.start();
    setIsRecording(true);
  };

  const stopRecording = async (isPart1: boolean = false) => {
    const recorder = mediaRecorderRef.current;
    if (!recorder) return;

    // set onstop BEFORE stopping to avoid race condition
    recorder.onstop = async () => {
      try {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const formData = new FormData();
        formData.append('file', audioBlob, `part${isPart1 ? '1' : '2'}.webm`);
        formData.append('topic', data?.topic || '');
        formData.append('user_id', session?.user?.email || '');
        formData.append('part', isPart1 ? '1' : '2');

        const questionId = isPart1
          ? data?.part1[questionIndex]?.id
          : data?.part2?.id;
        if (questionId) {
          formData.append('question_id', questionId);
        }

        const res = await fetch(`${base}/asr/transcribe`, {
          method: 'POST',
          body: formData,
        });
        const json = await res.json();

        if (isPart1 && json.text) {
          setPart1Transcripts(prev => {
            const updated = [...prev];
            updated[questionIndex] = json.text;
            return updated;
          });
        }

        // after finishing a part1 recording, if it was the last part1 question
        if (isPart1) {
          const lastIndex = (data?.part1.length ?? 0) - 1;
          if (questionIndex >= lastIndex) {
            setPart('prep');
            setPrepSeconds(60);
          } else {
            setQuestionIndex(i => i + 1);
          }
        } else {
          // finished part2 -> show followup / results
          setPart('followup');
        }
      } catch (err) {
        console.error('Upload/transcribe failed', err);
      } finally {
        // cleanup
        audioChunksRef.current = [];
        setIsRecording(false);
        // stop tracks to free mic
        try {
          recorder.stream.getTracks().forEach(t => t.stop());
        } catch {}
        mediaRecorderRef.current = null;
      }
    };

    // actually stop
    recorder.stop();
  };

  const startRecordingPart1 = () => startRecording();
  const stopRecordingPart1 = () => stopRecording(true);
  const startRecordingPart2 = () => startRecording();
  const stopRecordingPart2 = () => stopRecording(false);

  const handleNextPart1 = () => {
    const lastIndex = (data?.part1.length ?? 0) - 1;
    if (questionIndex >= lastIndex) {
      setPart('prep');
      setPrepSeconds(60);
    } else {
      setQuestionIndex(i => i + 1);
    }
  };

  if (!session) return <div className="p-8 text-center text-3xl">Login dulu!</div>;
  if (!data || !data.part2) return <div className="p-8 text-center text-3xl">Loading...</div>;

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-100 p-8">
      <div className="max-w-4xl mx-auto">
        {/* HEADER */}
        <div className="bg-white rounded-2xl shadow-2xl p-8 mb-8 text-center">
          <h1 className="text-5xl font-bold text-indigo-700 mb-2">IELTS Speaking Test</h1>
          <p className="text-2xl text-gray-700">Topik: <strong>{data.topic}</strong></p>
          <p className="text-3xl font-bold mt-6 text-purple-600">
            {part === 'intro' && 'Perkenalan'}
            {part === 'part1' && `Part 1 • ${questionIndex + 1}/${data.part1.length}`}
            {part === 'prep' && 'Persiapan 1 menit'}
            {part === 'part2' && 'Part 2 • Bicara 2 menit'}
            {part === 'followup' && 'Hasil Transkrip'}
          </p>
        </div>

        {/* INTRO */}
        {part === 'intro' && (
          <div className="bg-white rounded-2xl shadow-2xl p-16 text-center">
            <h2 className="text-4xl font-bold mb-10">Good morning! I&apos;m Sarah.</h2>
            <button onClick={() => setPart('part1')} className="px-20 py-8 bg-green-600 text-white text-3xl rounded-3xl hover:bg-green-700 shadow-2xl">
              Jawab: &quot;My name is {session.user?.name}&quot;
            </button>
          </div>
        )}

        {/* PART 1 */}
        {part === 'part1' && (
          <div className="bg-white rounded-2xl shadow-2xl p-16">
            <h3 className="text-4xl font-bold text-indigo-700 mb-16">{data.part1[questionIndex]?.question}</h3>
            <div className="flex justify-center mb-8">
              <button
                onClick={isRecording ? stopRecordingPart1 : startRecordingPart1}
                className={`w-20 h-20 rounded-full shadow-lg flex items-center justify-center transition-all ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-blue-500'}`}
              >
                {isRecording ? (
                  <svg className="w-10 h-10 text-white" fill="currentColor"><rect x="4" y="4" width="12" height="12" /></svg>
                ) : (
                  <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
                  </svg>
                )}
              </button>
            </div>
            <p className="text-center text-lg mb-4">{isRecording ? 'Merekam...' : 'Rekam jawaban'}</p>
            {part1Transcripts[questionIndex] && (
              <div className="bg-gray-100 p-4 rounded-lg text-sm mb-4">
                {part1Transcripts[questionIndex]}
              </div>
            )}
            <div className="flex justify-center gap-12 mt-8">
              <button onClick={() => setQuestionIndex(i => Math.max(0, i - 1))} disabled={questionIndex === 0}
                className="px-10 py-5 bg-gray-400 text-white text-2xl rounded-2xl disabled:opacity-50">
                Previous
              </button>
              <button onClick={handleNextPart1}
                className="px-16 py-6 bg-blue-600 text-white text-3xl rounded-3xl hover:bg-blue-700 shadow-2xl">
                {questionIndex === (data.part1.length - 1) ? 'Part 2' : 'Next'}
              </button>
            </div>
          </div>
        )}

        {/* PREP */}
        {part === 'prep' && (
          <div className="bg-white rounded-2xl shadow-2xl p-16 text-center">
            <h2 className="text-5xl font-bold text-purple-700 mb-12">Siapkan Jawaban (1 menit)</h2>
            <div className="bg-yellow-100 border-8 border-yellow-500 rounded-3xl p-12 mb-12">
              <p className="text-3xl font-bold mb-8">{data.part2.cue_card}</p>
              <ul className="text-left text-2xl space-y-6">
                {data.part2.bullets.map((b, i) => (
                  <li key={i} className="flex gap-4"><span className="text-4xl">•</span> {b}</li>
                ))}
              </ul>
            </div>
            <div className="text-9xl font-bold text-red-600">{formatTime(prepSeconds)}</div>
          </div>
        )}

        {/* PART 2 */}
        {part === 'part2' && (
          <div className="bg-white rounded-2xl shadow-2xl p-16 text-center">
            <h2 className="text-5xl font-bold text-green-700 mb-12">MULAI BICARA SEKARANG!</h2>
            <div className="bg-green-100 border-8 border-green-500 rounded-3xl p-12 mb-12">
              <p className="text-3xl font-bold mb-8">{data.part2.cue_card}</p>
              <ul className="text-left text-2xl space-y-6">
                {data.part2.bullets.map((b, i) => (
                  <li key={i} className="flex gap-4"><span className="text-4xl">•</span> <span className="font-bold text-green-700">{b}</span></li>
                ))}
              </ul>
            </div>
            <div className="text-9xl font-bold text-red-600 mb-10">{formatTime(speakSeconds)}</div>
            <button
              onClick={isRecording ? stopRecordingPart2 : startRecordingPart2}
              className={`w-32 h-32 rounded-full shadow-2xl flex items-center justify-center mx-auto transition-all transform hover:scale-110 ${isRecording ? 'bg-red-600 animate-pulse' : 'bg-gradient-to-r from-pink-500 to-purple-600'}`}
            >
              {isRecording ? (
                <svg className="w-20 h-20 text-white" fill="currentColor" viewBox="0 0 24 24"><rect x="6" y="6" width="12" height="12" /></svg>
              ) : (
                <svg className="w-20 h-20 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
                  <path d="M19 11c0 3.87-3.13 7-7 7s-7-3.13-7-7h-2c0 4.97 4.03 9 9 9s9-4.03 9-9h-2z" />
                </svg>
              )}
            </button>
            <p className="mt-6 text-3xl font-bold">{isRecording ? 'SEDANG Merekam...' : 'Tekan untuk Mulai Rekam'}</p>
          </div>
        )}

        {/* FOLLOWUP */}
        {part === 'followup' && (
          <div className="bg-white rounded-2xl shadow-2xl p-16 text-center">
            <h2 className="text-5xl font-bold text-indigo-700 mb-12">Selesai! Jawaban Tersimpan</h2>
            <button onClick={() => window.location.href = '/history'}
              className="mt-12 px-20 py-8 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-3xl rounded-3xl hover:from-green-600 hover:to-emerald-700 shadow-2xl">
              Lihat Skor AI + PDF
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
