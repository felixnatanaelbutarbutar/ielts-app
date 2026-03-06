// src/types/index.ts
export type Session = {
  id: string;
  user_id: string;
  part: 1 | 2;
  custom_prompt: string | null;
  started_at: string;
  finished_at: string | null;
};

export type FluencyResult = {
  transcript: string;
  words: Array<{
    word: string;
    start: number;
    end: number;
    probability: number;
  }>;
  duration: number;
  fluency_wpm: number;
  fluency_band: number;
};

export type CoherenceResult = {
  score: number;
  band: number;
  explanation: string;
};

export type VocabResult = {
  cefr_level: "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
  advanced_words: string[];
  score: number;
};

export type BandScores = {
  fluency: number;
  coherence: number;
  grammar: number;
  vocabulary: number;
  overall: number;
};

export type Artifact = {
  id: string;
  session_id: string;
  audio_url: string | null;
  transcript: string | null;
  fluency_json: FluencyResult | null;
  grammar_output: string | null;
  coherence_json: CoherenceResult | null;
  vocab_json: VocabResult | null;
  band_scores_json: BandScores | null;
  created_at: string;
};

export type Question = {
  id: string;
  part: 1 | 2;
  topic: string;
  prompt: string;
  active: boolean;
};