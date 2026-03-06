/* eslint-disable react/no-unescaped-entities */
// src/app/practice/new/page.tsx
'use client';
import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import { useSession } from 'next-auth/react';

interface Part1Question { id: string; question: string; }
interface Part2Data { id: string; cue_card: string; bullets: string[]; }
interface PracticeData { topic: string; part1: Part1Question[]; part2: Part2Data | null; }

export default function PracticePage() {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const topicSlug = searchParams.get('topic');

  const [rawData, setRawData] = useState<PracticeData | null>(null);
  const [data, setData] = useState<PracticeData | null>(null);
  const [part, setPart] = useState<'intro' | 'part1' | 'prep' | 'part2' | 'processing' | 'result'>('intro');
  const [questionIndex, setQuestionIndex] = useState(0);
  const [prepSeconds, setPrepSeconds] = useState(5);
  const [speakSeconds, setSpeakSeconds] = useState(120);
  const [isRecording, setIsRecording] = useState(false);
  const [part1Transcripts, setPart1Transcripts] = useState<string[]>([]);
  const [part2Transcript, setPart2Transcript] = useState('');
  const [artifactId, setArtifactId] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const base = process.env.NEXT_PUBLIC_API_BASE || 'http://127.0.0.1:8000';

  const shuffle = <T,>(arr: T[]) => {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  useEffect(() => {
    if (topicSlug) {
      fetch(`${base}/topics/${topicSlug}/questions`)
        .then(r => r.ok ? r.json() : Promise.reject())
        .then((d: PracticeData) => setRawData(d))
        .catch(() => setRawData(null));
    }
  }, [topicSlug, base]);

  useEffect(() => {
    if (!rawData) return;

    const allPart1 = Array.isArray(rawData.part1) ? rawData.part1 : [];
    const chosenPart1 = shuffle(allPart1).slice(0, Math.min(4, allPart1.length));

    let chosenPart2: Part2Data | null = null;
    if (rawData.part2) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (Array.isArray((rawData as any).part2)) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const arr = (rawData as any).part2 as Part2Data[];
        chosenPart2 = shuffle(arr).slice(0, 1)[0] ?? null;
      } else {
        chosenPart2 = rawData.part2;
      }
    }

    const sessionData: PracticeData = {
      topic: rawData.topic,
      part1: chosenPart1,
      part2: chosenPart2
    };

    setData(sessionData);
    setQuestionIndex(0);
    setPart1Transcripts(Array(sessionData.part1.length).fill(''));
    setPart2Transcript('');
    setArtifactId(null);
    setPart('intro');
  }, [rawData]);

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

  useEffect(() => {
    if (part === 'part2' && speakSeconds > 0) {
      const t = setTimeout(() => setSpeakSeconds(s => s - 1), 1000);
      return () => clearTimeout(t);
    } else if (part === 'part2' && speakSeconds === 0) {
      stopRecordingPart2();
    }
  }, [part, speakSeconds]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = []; // reset
      // use explicit mimeType if supported
      let recorder: MediaRecorder;
      try {
        recorder = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' });
      } catch {
        recorder = new MediaRecorder(stream);
      }

      recorder.ondataavailable = e => {
        if (e.data && e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      // keep recorder reference
      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error('Cannot access microphone', err);
      alert('Gagal akses microphone. Pastikan izin microphone diberikan di browser.');
    }
  };


  const stopRecording = async (isPart1: boolean = false) => {
    const recorder = mediaRecorderRef.current;
    if (!recorder) return;

    recorder.onstop = async () => {
      try {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });

        // DEBUG: log size
        console.debug('Recorded blob size (bytes):', audioBlob.size);

        if (!audioBlob || audioBlob.size === 0) {
          alert('Rekaman kosong — coba rekam lagi dan pastikan suara cukup jelas/nyaring.');
          // stop tracks
          try { recorder.stream.getTracks().forEach(t => t.stop()); } catch { }
          setIsRecording(false);
          audioChunksRef.current = [];
          mediaRecorderRef.current = null;
          return;
        }

        const formData = new FormData();
        formData.append('file', audioBlob, `part${isPart1 ? '1' : '2'}.webm`);
        formData.append('topic', data?.topic || '');
        formData.append('user_id', session?.user?.email || '');
        formData.append('part', isPart1 ? '1' : '2');

        const questionId = isPart1 ? data?.part1[questionIndex]?.id : data?.part2?.id;
        if (questionId) formData.append('question_id', questionId);

        // IMPORTANT: disable VAD for debugging/short recordings
        formData.append('vad', 'false');

        if (!isPart1) setPart('processing');

        const res = await fetch(`${base}/asr/transcribe`, { method: 'POST', body: formData });

        // HANDLE NON-OK FROM SERVER (e.g. 400 Transkrip kosong)
        if (!res.ok) {
          let errJson = null;
          try { errJson = await res.json(); } catch { }
          const msg = errJson?.detail || `Transcribe failed (status ${res.status})`;
          alert(msg); // beri tahu user jelas kenapa gagal
          console.warn('Transcribe error:', msg);
          // cleanup and return
          audioChunksRef.current = [];
          setIsRecording(false);
          try { recorder.stream.getTracks().forEach(t => t.stop()); } catch { }
          mediaRecorderRef.current = null;
          // fallback: if part1, leave UI so user can retry; if part2, go back to result or let user retry
          if (!isPart1) setPart('part2');
          return;
        }

        // success
        const json = await res.json();

        if (isPart1 && json.text) {
          setPart1Transcripts(prev => {
            const updated = [...prev];
            updated[questionIndex] = json.text;
            return updated;
          });
        } else if (!isPart1 && json.text) {
          setPart2Transcript(json.text);
          setArtifactId(json.artifact_id ?? null);
          setPart('result');
        }
      } catch (err) {
        console.error('Upload/transcribe failed', err);
        alert('Terjadi kesalahan saat mengirim rekaman. Coba lagi.');
      } finally {
        // cleanup
        audioChunksRef.current = [];
        setIsRecording(false);
        try { recorder.stream.getTracks().forEach(t => t.stop()); } catch { }
        mediaRecorderRef.current = null;
      }
    };

    // finally stop recording (onstop already attached)
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
      setPrepSeconds(5);
    } else {
      setQuestionIndex(i => i + 1);
    }
  };

  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="bg-white rounded-3xl shadow-2xl p-16 text-center max-w-md">
          <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">🔒</span>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Access Denied</h2>
          <p className="text-gray-600 mb-8">Please login to start your practice session</p>
          <button
            onClick={() => router.push('/')}
            className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  if (!data || !data.part2) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative mb-8">
            <div className="animate-spin rounded-full h-24 w-24 border-4 border-blue-100 border-t-blue-600 mx-auto"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <div className="animate-pulse w-10 h-10 bg-blue-600 rounded-full"></div>
            </div>
          </div>
          <p className="text-2xl text-gray-700 font-semibold">Loading your practice session...</p>
        </div>
      </div>
    );
  }

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4 md:p-8">
      {/* Decorative Elements */}
      <div className="fixed top-20 right-20 w-64 h-64 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
      <div className="fixed bottom-20 left-20 w-64 h-64 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>

      <div className="max-w-5xl mx-auto relative">
        {/* HEADER */}
        <div className="bg-white/90 backdrop-blur-lg rounded-3xl shadow-xl border border-gray-100 p-8 mb-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-blue-400/10 to-purple-400/10 rounded-full blur-3xl"></div>

          <div className="relative text-center">
            <div className="inline-flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <span className="text-2xl">🎤</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 text-transparent bg-clip-text">
                IELTS Speaking Test
              </h1>
            </div>

            <div className="inline-block mb-4">
              <span className="px-6 py-2 bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700 rounded-full text-lg font-semibold border border-blue-200">
                Topic: {data.topic}
              </span>
            </div>

            <div className="mt-6">
              <div className="inline-block px-8 py-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl border-2 border-purple-200">
                <p className="text-2xl md:text-3xl font-bold text-purple-700">
                  {part === 'intro' && '👋 Introduction'}
                  {part === 'part1' && `📝 Part 1 • Question ${questionIndex + 1}/${data.part1.length}`}
                  {part === 'prep' && '⏱️ Preparation Time'}
                  {part === 'part2' && '🎙️ Part 2 • Speaking'}
                  {part === 'processing' && '⚡ Processing...'}
                  {part === 'result' && '✅ Results'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* INTRO */}
        {part === 'intro' && (
          <div className="bg-white/90 backdrop-blur-lg rounded-3xl shadow-xl border border-gray-100 p-12 md:p-16 text-center relative overflow-hidden animate-fade-in">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-gradient-to-br from-green-400/20 to-emerald-400/20 rounded-full blur-3xl"></div>

            <div className="relative">
              <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg animate-bounce-slow">
                <span className="text-5xl">👩‍🏫</span>
              </div>

              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Good morning! I'm Sarah.
              </h2>
              <p className="text-xl text-gray-600 mb-12">
                Welcome to your IELTS Speaking practice session
              </p>

              <button
                onClick={() => setPart('part1')}
                className="group px-12 py-6 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-2xl font-bold rounded-2xl hover:from-green-600 hover:to-emerald-700 transition-all shadow-lg hover:shadow-2xl transform hover:scale-105"
              >
                <span className="flex items-center gap-3 justify-center">
                  Start Practice
                  <svg className="w-6 h-6 transform group-hover:translate-x-2 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </span>
              </button>

              <p className="mt-6 text-gray-500 text-sm">
                Say: "My name is {session.user?.name}"
              </p>
            </div>
          </div>
        )}

        {/* PART 1 */}
        {part === 'part1' && (
          <div className="bg-white/90 backdrop-blur-lg rounded-3xl shadow-xl border border-gray-100 p-8 md:p-16 relative overflow-hidden animate-fade-in">
            <div className="absolute -top-10 -left-10 w-40 h-40 bg-gradient-to-br from-blue-400/20 to-indigo-400/20 rounded-full blur-3xl"></div>

            <div className="relative">
              {/* Question Card */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8 mb-8 border-2 border-blue-200">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0">
                    <span className="text-2xl">❓</span>
                  </div>
                  <h3 className="text-2xl md:text-3xl font-bold text-gray-900 leading-relaxed">
                    {data.part1[questionIndex]?.question}
                  </h3>
                </div>
              </div>

              {/* Recording Button */}
              <div className="flex flex-col items-center mb-8">
                <button
                  onClick={isRecording ? stopRecordingPart1 : startRecordingPart1}
                  className={`relative w-24 h-24 rounded-full shadow-2xl flex items-center justify-center transition-all transform hover:scale-110 ${isRecording
                    ? 'bg-gradient-to-br from-red-500 to-pink-600 animate-pulse'
                    : 'bg-gradient-to-br from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700'
                    }`}
                >
                  {isRecording ? (
                    <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <rect x="6" y="6" width="12" height="12" rx="2" />
                    </svg>
                  ) : (
                    <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
                      <path d="M19 11c0 3.87-3.13 7-7 7s-7-3.13-7-7h-2c0 4.97 4.03 9 9 9s9-4.03 9-9h-2z" />
                    </svg>
                  )}

                  {isRecording && (
                    <span className="absolute -bottom-2 -right-2 w-6 h-6 bg-red-500 rounded-full animate-ping"></span>
                  )}
                </button>

                <p className="mt-4 text-lg font-semibold text-gray-700">
                  {isRecording ? '🔴 Recording...' : 'Click to Record'}
                </p>
              </div>

              {/* Transcript Display */}
              {part1Transcripts[questionIndex] && (
                <div className="bg-gray-50 border-2 border-gray-200 rounded-2xl p-6 mb-8 animate-fade-in">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-lg">✓</span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-500 mb-2">Your Answer:</p>
                      <p className="text-lg text-gray-800 leading-relaxed">
                        {part1Transcripts[questionIndex]}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex justify-between gap-4">
                <button
                  onClick={() => setQuestionIndex(i => Math.max(0, i - 1))}
                  disabled={questionIndex === 0}
                  className="px-8 py-4 bg-gray-200 text-gray-700 text-lg font-semibold rounded-xl hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  ← Previous
                </button>

                <button
                  onClick={handleNextPart1}
                  className="flex-1 px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-lg font-bold rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  {questionIndex === (data.part1.length - 1) ? 'Continue to Part 2 →' : 'Next Question →'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* PREP */}
        {part === 'prep' && (
          <div className="bg-white/90 backdrop-blur-lg rounded-3xl shadow-xl border border-gray-100 p-8 md:p-16 text-center relative overflow-hidden animate-fade-in">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-gradient-to-br from-yellow-400/20 to-orange-400/20 rounded-full blur-3xl"></div>

            <div className="relative">
              <div className="inline-flex items-center gap-3 mb-8">
                <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center animate-pulse">
                  <span className="text-3xl">⏱️</span>
                </div>
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
                  Preparation Time
                </h2>
              </div>

              {/* Cue Card */}
              <div className="bg-gradient-to-br from-yellow-50 to-orange-50 border-4 border-yellow-400 rounded-3xl p-8 md:p-12 mb-12 shadow-lg">
                <p className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">
                  {data.part2.cue_card}
                </p>
                <ul className="text-left text-lg md:text-xl space-y-4">
                  {data.part2.bullets.map((b, i) => (
                    <li key={i} className="flex gap-4 items-start">
                      <span className="text-yellow-600 text-2xl font-bold flex-shrink-0">•</span>
                      <span className="text-gray-800">{b}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Timer */}
              <div className="relative inline-block">
                <div className="absolute inset-0 bg-gradient-to-br from-red-500 to-pink-600 rounded-3xl blur-2xl opacity-50 animate-pulse"></div>
                <div className="relative bg-white rounded-3xl px-12 py-8 shadow-2xl border-4 border-red-500">
                  <p className="text-7xl md:text-9xl font-bold bg-gradient-to-r from-red-600 to-pink-600 text-transparent bg-clip-text">
                    {formatTime(prepSeconds)}
                  </p>
                </div>
              </div>

              <p className="mt-8 text-xl text-gray-600">
                Prepare your thoughts and make notes
              </p>
            </div>
          </div>
        )}

        {/* PART 2 */}
        {part === 'part2' && (
          <div className="bg-white/90 backdrop-blur-lg rounded-3xl shadow-xl border border-gray-100 p-8 md:p-16 text-center relative overflow-hidden animate-fade-in">
            <div className="absolute -top-10 -left-10 w-40 h-40 bg-gradient-to-br from-green-400/20 to-emerald-400/20 rounded-full blur-3xl"></div>

            <div className="relative">
              <div className="inline-flex items-center gap-3 mb-8">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center animate-bounce-slow">
                  <span className="text-3xl">🎙️</span>
                </div>
                <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 text-transparent bg-clip-text">
                  Start Speaking Now!
                </h2>
              </div>

              {/* Cue Card */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-4 border-green-400 rounded-3xl p-8 md:p-12 mb-12 shadow-lg">
                <p className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">
                  {data.part2.cue_card}
                </p>
                <ul className="text-left text-lg md:text-xl space-y-4">
                  {data.part2.bullets.map((b, i) => (
                    <li key={i} className="flex gap-4 items-start">
                      <span className="text-green-600 text-2xl font-bold flex-shrink-0">•</span>
                      <span className="text-green-900 font-semibold">{b}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Timer */}
              <div className="relative inline-block mb-12">
                <div className="absolute inset-0 bg-gradient-to-br from-red-500 to-pink-600 rounded-3xl blur-2xl opacity-50 animate-pulse"></div>
                <div className="relative bg-white rounded-3xl px-12 py-8 shadow-2xl border-4 border-red-500">
                  <p className="text-7xl md:text-9xl font-bold bg-gradient-to-r from-red-600 to-pink-600 text-transparent bg-clip-text">
                    {formatTime(speakSeconds)}
                  </p>
                </div>
              </div>

              {/* Recording Button */}
              <button
                onClick={isRecording ? stopRecordingPart2 : startRecordingPart2}
                className={`relative w-32 h-32 rounded-full shadow-2xl flex items-center justify-center mx-auto transition-all transform hover:scale-110 ${isRecording
                  ? 'bg-gradient-to-br from-red-500 to-pink-600 animate-pulse'
                  : 'bg-gradient-to-br from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700'
                  }`}
              >
                {isRecording ? (
                  <svg className="w-20 h-20 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <rect x="6" y="6" width="12" height="12" rx="2" />
                  </svg>
                ) : (
                  <svg className="w-20 h-20 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
                    <path d="M19 11c0 3.87-3.13 7-7 7s-7-3.13-7-7h-2c0 4.97 4.03 9 9 9s9-4.03 9-9h-2z" />
                  </svg>
                )}

                {isRecording && (
                  <span className="absolute -bottom-3 -right-3 w-8 h-8 bg-red-500 rounded-full animate-ping"></span>
                )}
              </button>

              <p className="mt-6 text-2xl font-bold text-gray-700">
                {isRecording ? '🔴 Recording Your Answer...' : 'Click to Start Recording'}
              </p>
            </div>
          </div>
        )}

        {/* PROCESSING */}
        {part === 'processing' && (
          <div className="bg-white/90 backdrop-blur-lg rounded-3xl shadow-xl border border-gray-100 p-16 text-center relative overflow-hidden animate-fade-in">
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl animate-pulse"></div>

            <div className="relative">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-8 animate-bounce-slow">
                <span className="text-5xl">⚡</span>
              </div>

              <h2 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 text-transparent bg-clip-text mb-8">
                Processing Your Answer
              </h2>

              <div className="flex justify-center mb-8">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-100 border-t-blue-600"></div>
              </div>

              <p className="text-xl text-gray-600">
                Analyzing your response with AI...
              </p>
            </div>
          </div>
        )}

        {/* RESULT PAGE */}
        {part === 'result' && (
          <div className="bg-white/90 backdrop-blur-lg rounded-3xl shadow-xl border border-gray-100 p-8 md:p-16 relative overflow-hidden animate-fade-in">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-gradient-to-br from-green-400/20 to-emerald-400/20 rounded-full blur-3xl"></div>

            <div className="relative">
              {/* Header */}
              <div className="text-center mb-12">
                <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <span className="text-4xl">✅</span>
                </div>
                <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 text-transparent bg-clip-text mb-3">
                  Practice Complete!
                </h2>
                <p className="text-xl text-gray-600">
                  Here's a summary of your responses
                </p>
              </div>

              <div className="space-y-8 mb-12">
                {/* PART 1 RESULTS */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8 border-2 border-blue-200">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                      <span className="text-2xl">📝</span>
                    </div>
                    <h3 className="text-3xl font-bold text-blue-900">Part 1 Responses</h3>
                  </div>

                  <div className="space-y-6">
                    {data.part1.map((q, i) => (
                      <div key={i} className="bg-white rounded-xl p-6 shadow-md border border-blue-100 hover:shadow-lg transition-shadow">
                        <div className="flex items-start gap-3 mb-3">
                          <div className="w-8 h-8 bg-blue-500 text-white rounded-lg flex items-center justify-center font-bold flex-shrink-0">
                            {i + 1}
                          </div>
                          <p className="text-lg font-semibold text-gray-900">
                            {q.question}
                          </p>
                        </div>
                        <div className="pl-11">
                          <p className="text-gray-700 leading-relaxed">
                            {part1Transcripts[i] || '❌ Not answered'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* PART 2 RESULTS */}
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-8 border-2 border-green-200">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                      <span className="text-2xl">🎙️</span>
                    </div>
                    <h3 className="text-3xl font-bold text-green-900">Part 2 Response</h3>
                  </div>

                  <div className="bg-white rounded-xl p-6 shadow-md border border-green-100">
                    <div className="mb-4">
                      <p className="text-xl font-bold text-green-900 mb-3">
                        {data.part2.cue_card}
                      </p>
                      <ul className="space-y-2 mb-4">
                        {data.part2.bullets.map((b, i) => (
                          <li key={i} className="flex gap-3 text-green-800">
                            <span className="text-green-600 font-bold">•</span>
                            <span>{b}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="pt-4 border-t-2 border-green-100">
                      <p className="text-sm font-semibold text-gray-500 mb-2">Your Answer:</p>
                      <p className="text-gray-700 leading-relaxed">
                        {part2Transcript || '❌ Not answered'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col md:flex-row gap-4 justify-center">
                <button
                  onClick={() => router.push('/history')}
                  className="group px-10 py-5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xl font-bold rounded-2xl hover:from-purple-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-2xl transform hover:scale-105"
                >
                  <span className="flex items-center gap-3 justify-center">
                    <span>📊</span>
                    View AI Score & PDF
                    <svg className="w-5 h-5 transform group-hover:translate-x-2 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </span>
                </button>

                <button
                  onClick={() => {
                    if (rawData) {
                      setRawData({ ...rawData });
                    }
                    setPart('intro');
                    router.push('/practice');
                  }}
                  className="px-10 py-5 bg-gradient-to-r from-gray-600 to-gray-700 text-white text-xl font-bold rounded-2xl hover:from-gray-700 hover:to-gray-800 transition-all shadow-lg hover:shadow-2xl transform hover:scale-105"
                >
                  <span className="flex items-center gap-3 justify-center">
                    <span>🔄</span>
                    Practice Again
                  </span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }
        .animate-bounce-slow {
          animation: bounce-slow 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}