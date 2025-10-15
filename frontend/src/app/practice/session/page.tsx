'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useSessionStore } from '../../../lib/zustand';
import StageHeader from '../../components/session/StageHeader';
import PromptCard from '../../components/session/PromptCard';
import Recorder from '../../components/session/Recorder';
import Countdown from '../../components/session/Countdown';
import ProgressDots from '../../components/session/ProgressDots';

function Loading() {
  return <div className="flex justify-center items-center min-h-screen">Loading session...</div>;
}

function SessionContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isPrep, setIsPrep] = useState(false);
  const {
    sessionId,
    currentPart,
    currentQuestion,
    setSession,
    setCurrentQuestion,
    addAnswer,
    setProcessing,
  } = useSessionStore();

  const topicId = searchParams.get('topic');
  const level = searchParams.get('level');

  // Fix: Define topic dari topicId, atau fallback
  const topic = topicId || 'general';

  useEffect(() => {
    if (!sessionId && topicId && level) {
      // Call backend buat start session
      fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ part: 1, topic, questionId: 'default', customPrompt: topic }),
      }).then(res => res.json()).then(data => {
        setSession(data.sessionId, 1, { id: 'q1', text: `Tell me about your ${topic}.`, index: 1 });
      }).catch(console.error);
    }
  }, [sessionId, topicId, level, setSession, topic]);  // Fix: Tambah topic ke deps

  const handleAnswerSubmit = async (audioBlob: Blob, duration: number) => {
    addAnswer({ questionId: currentQuestion.id, audio: audioBlob, duration });
    const formData = new FormData();
    formData.append('sessionId', sessionId!);
    formData.append('audio', audioBlob, 'recording.webm');
    formData.append('transcript', 'dummy transcript');  // Dari Whisper nanti
    formData.append('fluencyJson', JSON.stringify({ wpm: duration * 10 }));  // Dummy dari backend
    formData.append('grammarOutput', 'dummy grammar');
    formData.append('coherenceJson', JSON.stringify({ score: 7.0 }));
    formData.append('vocabJson', JSON.stringify({ coverage: 'B2' }));
    formData.append('bandScoresJson', JSON.stringify({ grammar: 7.0, vocab: 7.5, fluency: 7.2, coherence: 7.3, overall: 7.25 }));

    const response = await fetch('/api/artifacts', {
      method: 'POST',
      body: formData,
    });
    const data = await response.json();

    if (data.nextPart === 2) {
      setIsPrep(true);
      setCurrentQuestion({ ...data.cueCard, index: 1 });
    } else if (data.nextQuestion) {
      setCurrentQuestion(data.nextQuestion);
    } else {
      // Finish session
      fetch('/api/sessions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, finishedAt: new Date().toISOString() }),
      });
      setProcessing();
      router.push(`/results/${sessionId}?jobId=${data.jobId}`);
    }
  };

  const handlePrepFinish = () => {
    setIsPrep(false);
  };

  if (!sessionId) return <div>Loading session...</div>;

  const maxDuration = currentPart === 2 ? 120 : 30;

  return (
    <div className="min-h-screen bg-gray-50 p-4 flex flex-col md:flex-row gap-6">
      <div className="flex-1 space-y-4">
        <StageHeader part={currentPart} topicId={topicId!} />
        <ProgressDots current={currentQuestion.index || 1} total={currentPart === 1 ? 6 : 1} />
        <PromptCard 
          content={(currentQuestion.text || currentQuestion.cueCard) || ''} 
          type={currentPart === 2 ? 'cue' : 'question'}
          onPrepDone={handlePrepFinish}
        />
        {isPrep && <Countdown duration={60} onFinish={handlePrepFinish} />}
      </div>

      <div className="flex-1 space-y-4">
        <Recorder 
          onSubmit={handleAnswerSubmit}
          maxDuration={maxDuration}
          isActive={currentPart !== 'processing' && !isPrep}
        />
        {currentPart === 'processing' && (
          <div className="flex justify-center items-center gap-2">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <p>Processing your session...</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SessionPage() {
  return (
    <Suspense fallback={<Loading />}>
      <SessionContent />
    </Suspense>
  );
}