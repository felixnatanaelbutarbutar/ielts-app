'use client';

import { useState, useEffect } from 'react';

interface CountdownProps {
  duration: number;
  onFinish: () => void;
}

export default function Countdown({ duration, onFinish }: CountdownProps) {
  const [timeLeft, setTimeLeft] = useState(duration);

  useEffect(() => {
    if (timeLeft <= 0) {
      onFinish();
      return;
    }
    const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
    return () => clearTimeout(timer);
  }, [timeLeft, onFinish]);

  return (
    <div className="text-center p-4 bg-yellow-100 rounded">
      <h3>Preparation Time</h3>
      <div className="text-4xl font-bold">{timeLeft}s</div>
    </div>
  );
}