'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';

interface RecorderProps {
  onSubmit: (blob: Blob, duration: number) => void;
  maxDuration: number;
  isActive: boolean;
}

export default function Recorder({ onSubmit, maxDuration, isActive }: RecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startRecording = async () => {
    try {
      setError(null);
      streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(streamRef.current, { mimeType: 'audio/webm' });
      const chunks: BlobPart[] = [];

      mediaRecorderRef.current.ondataavailable = (e) => chunks.push(e.data);
      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        onSubmit(blob, duration);
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      timerRef.current = setInterval(() => setDuration((d) => {
        if (d >= maxDuration) {
          stopRecording();
          return d;
        }
        return d + 1;
      }), 1000);
    } catch (error) {  
      console.error('Recording error:', error); 
      setError('Mic access denied. Enable in browser settings.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
      streamRef.current?.getTracks().forEach(track => track.stop());
    }
    setIsRecording(false);
    setDuration(0);
    if (timerRef.current) clearInterval(timerRef.current);
    // Auto-submit kalau auto-stop
    if (duration >= maxDuration - 1) onSubmit(new Blob([]), duration);  
  };

  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="space-y-2 p-4 border rounded-lg bg-white">
      <p>Record your answer (Max: {maxDuration}s)</p>
      <div className="flex justify-center">
        <Button 
          onClick={isRecording ? stopRecording : startRecording}
          disabled={!isActive || isRecording}
          className={isRecording ? 'bg-red-500' : 'bg-green-500'}
        >
          {isRecording ? `Stop (${duration}s)` : 'Start Recording'}
        </Button>
      </div>
      {isRecording && (
        <div className="w-full bg-red-200 h-2 rounded">
          <div 
            className="bg-red-500 h-2 rounded" 
            style={{ width: `${(duration / maxDuration) * 100}%` }} 
          />
        </div>
      )}
    </div>
  );
}