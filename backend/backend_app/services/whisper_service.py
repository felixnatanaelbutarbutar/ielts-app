# backend/backend_app/services/whisper_service.py
from faster_whisper import WhisperModel
import os

model = WhisperModel("large-v3", device="cuda" if os.getenv("USE_GPU") else "cpu", compute_type="float16")

def transcribe_and_fluency(audio_path: str):
    segments, info = model.transcribe(audio_path, beam_size=5, word_timestamps=True)
    words = []
    transcript = ""
    for segment in segments:
        for word in segment.words:
            words.append({
                "word": word.word,
                "start": word.start,
                "end": word.end,
                "probability": word.probability
            })
        transcript += segment.text + " "
    
    total_duration = info.duration
    word_count = len(words)
    wpm = (word_count / total_duration) * 60 if total_duration > 0 else 0
    fluency_score = min(9.0, max(4.0, round(wpm / 20, 1)))  # 100-180 wpm → 5-9
    
    return {
        "transcript": transcript.strip(),
        "words": words,
        "language": info.language,
        "duration": total_duration,
        "fluency_wpm": round(wpm, 1),
        "fluency_band": fluency_score
    }