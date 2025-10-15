import { create } from 'zustand';

export type Part = 1 | 2 | 'processing';

interface Question {
  id: string;
  text?: string;
  cueCard?: { title: string; bullets: string[] };
  index?: number;
}

interface Answer {
  questionId: string;
  audio: Blob;
  duration: number;
}

interface SessionState {
  sessionId: string | null;
  currentPart: Part;
  currentQuestion: Question;
  answers: Answer[];
  setSession: (id: string, part: Part, question: Question) => void;
  setCurrentQuestion: (q: Partial<Question>) => void;
  addAnswer: (answer: Answer) => void;
  setProcessing: () => void;
}

export const useSessionStore = create<SessionState>((set) => ({  // Fix: Hapus 'get' (unused)
  sessionId: null,
  currentPart: 1 as Part,
  currentQuestion: { id: '', index: 1 },
  answers: [],
  setSession: (id, part, question) => set({ 
    sessionId: id, 
    currentPart: part, 
    currentQuestion: { ...question, index: question.index ?? 1 } 
  }),
  setCurrentQuestion: (q) => set((state) => ({ 
    currentQuestion: { 
      ...state.currentQuestion, 
      ...q, 
      index: q.index ?? state.currentQuestion.index ?? 1 
    } 
  })),
  addAnswer: (answer) => set((state) => ({ answers: [...state.answers, answer] })),
  setProcessing: () => set({ currentPart: 'processing' as const }),
}));