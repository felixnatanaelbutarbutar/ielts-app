interface SessionResponse {
  sessionId: string;
  part: 1 | 2;
  question: { id: string; text?: string; cueCard?: { title: string; bullets: string[] }; index?: number };
}

interface AnswerResponse {
  next: { part: 1 | 2; question?: { id: string; text: string; index: number }; cueCard?: { title: string; bullets: string[] } };
}

const API_BASE = '/api';

export async function startSession({ topicId, level }: { topicId: string; level: string }): Promise<SessionResponse> {
  if (process.env.NODE_ENV === 'development') {
    return {
      sessionId: 'mock1',
      part: 1,
      question: { id: 'q1', text: `Tell me about your ${topicId}.`, index: 1 }  // <-- Tambah index: 1 (default)
    } as SessionResponse;
  }

  const res = await fetch(`${API_BASE}/session/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ topicId, level }),
  });
  if (!res.ok) throw new Error('Failed to start session');
  return res.json();
}

export async function postAnswer(sessionId: string, questionId: string, audioBlob?: Blob): Promise<AnswerResponse> {
  if (process.env.NODE_ENV === 'development') {
    const currentIndex = parseInt(questionId.replace('q', '')) || 1;
    if (currentIndex < 6) {
      return {
        next: {
          part: 1,
          question: { id: `q${currentIndex + 1}`, text: `Follow-up question ${currentIndex + 1} on ${sessionId}.`, index: currentIndex + 1 }  // <-- index: number
        }
      } as AnswerResponse;
    } else {
      return {
        next: {
          part: 2,
          cueCard: { title: 'Describe a memorable trip', bullets: ['When and where', 'Who with', 'What happened', 'Why memorable'] }
        }
      } as AnswerResponse;
    }
  }

  const formData = new FormData();
  if (audioBlob) formData.append('audio', audioBlob, 'answer.webm');
  formData.append('questionId', questionId);

  const res = await fetch(`${API_BASE}/session/${sessionId}/answer`, { method: 'POST', body: formData });
  if (!res.ok) throw new Error('Failed to post answer');
  return res.json();
}

export async function finalizeSession(sessionId: string): Promise<string> {
  if (process.env.NODE_ENV === 'development') {
    // Mock jobId
    return 'mock-job-123';
  }

  const res = await fetch(`${API_BASE}/session/${sessionId}/finalize`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to finalize');
  const { jobId } = await res.json();
  return jobId;
}

export async function getAnalyzeStatus(jobId: string) {
  if (process.env.NODE_ENV === 'development') {
    // Mock status: Simulate processing -> complete setelah delay (tapi di async, langsung complete buat test)
    return { stage: 'complete', progress: 100 };
  }

  const res = await fetch(`${API_BASE}/analyze/status/${jobId}`);
  if (!res.ok) throw new Error('Failed to get status');
  return res.json();
}