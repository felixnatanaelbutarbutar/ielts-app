// src/app/practice/[sessionId]/page.tsx
'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

type Part1Question = { id: number; question: string };
type Part2Question = { id: number; cue_card: string; bullets: string[] };

export default function PracticeSession() {
  const { sessionId } = useParams();
  const [currentQ, setCurrentQ] = useState(0);
  const [part1, setPart1] = useState<Part1Question[]>([]);
  const [part2, setPart2] = useState<Part2Question | null>(null);
  const [isPart2, setIsPart2] = useState(false);

  useEffect(() => {
    fetch(`/api/proxy/sessions/${sessionId}/questions`)
      .then(r => r.json())
      .then(data => {
        setPart1(data.part1);
        setPart2(data.part2);
      });
  }, [sessionId]);

  const currentQuestion = isPart2 ? null : part1[currentQ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 to-purple-800 flex items-center justify-center p-8">
      <div className="max-w-5xl w-full bg-white rounded-3xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-8 text-center">
          <h1 className="text-5xl font-bold">IELTS Speaking Practice</h1>
          <p className="text-2xl mt-4 opacity-90">
            {isPart2 ? 'Part 2 - Long Turn (1-2 menit)' : `Part 1 - Question ${currentQ + 1}/4`}
          </p>
        </div>

        <div className="p-12">
          {/* PART 1 */}
          {!isPart2 && currentQuestion && (
            <div className="text-center">
              <div className="bg-blue-50 border-4 border-blue-200 rounded-3xl p-12 mb-10">
                <p className="text-4xl font-bold text-blue-900 leading-relaxed">
                  {currentQuestion.question}
                </p>
              </div>

              <div className="mt-16">
                <div className="text-6xl mb-8 animate-pulse text-red-600">Recording</div>
                <button
                  onClick={() => {
                    if (currentQ < 3) setCurrentQ(prev => prev + 1);
                    else setIsPart2(true);
                  }}
                  className="px-20 py-10 bg-gradient-to-r from-red-600 to-pink-600 text-white text-3xl font-bold rounded-full hover:scale-105 transition shadow-2xl"
                >
                  Berhenti & Lanjut → ({currentQ < 3 ? 'Pertanyaan Berikutnya' : 'Ke Part 2'})
                </button>
              </div>
            </div>
          )}

          {/* PART 2 - CUE CARD WITH BULLETS */}
          {isPart2 && part2 && (
            <div className="max-w-4xl mx-auto">
              <div className="bg-gradient-to-br from-purple-100 to-pink-100 border-4 border-purple-300 rounded-3xl p-10 shadow-xl">
                <h2 className="text-4xl font-bold text-purple-900 text-center mb-10">
                  {part2.cue_card}
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
                  {part2.bullets.map((bullet, i) => (
                    <div
                      key={i}
                      className="bg-white rounded-2xl p-8 shadow-lg border-l-8 border-purple-600 flex items-center gap-6 transform hover:scale-105 transition"
                    >
                      <div className="text-6xl font-bold text-purple-600 opacity-30">
                        {i + 1}
                      </div>
                      <p className="text-2xl font-medium text-gray-800">
                        {bullet}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Timer & Record Button */}
              <div className="text-center mt-16">
                <div className="text-8xl font-mono font-bold text-red-600 mb-8">02:00</div>
                <button className="px-24 py-12 bg-gradient-to-r from-green-600 to-emerald-600 text-white text-4xl font-bold rounded-full hover:scale-110 transition shadow-2xl">
                  Mulai Jawab 2 Menit
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}