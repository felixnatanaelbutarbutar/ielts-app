# backend/backend_app/services/coherence_service.py
import os
import torch
import numpy as np
import re
from sentence_transformers import SentenceTransformer
from transformers import AutoTokenizer, AutoModel
from typing import List

# E5
E5_MODEL = "intfloat/e5-base-v2"
e5 = SentenceTransformer(E5_MODEL, device="cuda" if torch.cuda.is_available() else "cpu")

# DeBERTa
MODEL_PATH = "models/coherence/deberta_v3_base_reg_huber_pair_20251029_150534"
tokenizer = AutoTokenizer.from_pretrained(MODEL_PATH)
model = AutoModel.from_pretrained(MODEL_PATH)
model.eval()
if torch.cuda.is_available():
    model.cuda()

CONNECTORS = [
    "and","also","in addition","moreover","besides","furthermore","first","second","then","next","finally",
    "because","so","therefore","thus","as a result","however","but","although","though","on the other hand",
    "for example","for instance","such as","in fact","indeed","in conclusion","to sum up"
]

def sent_split(t: str) -> List[str]:
    return [s.strip() for s in re.split(r'(?<=[.!?])\s+', (t or "").strip()) if s.strip()]

def word_count(t: str) -> int:
    return len(re.findall(r"\b\w+\b", (t or "")))

def connector_density(t: str) -> float:
    txt = (t or "").lower()
    c = sum(len(re.findall(r"\b" + re.escape(k) + r"\b", txt)) for k in CONNECTORS)
    wc = max(1, word_count(txt))
    return float(c / wc)

@torch.inference_mode()
def e5_embed(texts):
    return e5.encode(texts, convert_to_numpy=True, normalize_embeddings=True, show_progress_bar=False)

def adj_sim_e5(answer: str) -> float:
    s = sent_split(answer)
    if len(s) < 2:
        return 1.0
    embs = e5_embed(["passage: " + x for x in s])
    sims = [float(np.dot(embs[i], embs[i+1])) for i in range(len(embs)-1)]
    return float(np.mean(sims))

def build_features(prompt: str, answer: str) -> np.ndarray:
    prs = e5_embed([f"query: {prompt}"])[0]
    ans = e5_embed([f"passage: {answer}"])[0]
    qa = float(np.dot(prs, ans))
    adj = adj_sim_e5(answer)
    den = connector_density(answer)
    return np.array([qa, adj, den], dtype=np.float32)

@torch.inference_mode()
def predict_coherence(prompt: str, answer: str) -> dict:
    # Tokenize
    enc = tokenizer(prompt, answer, truncation=True, max_length=512, return_tensors="pt")
    input_ids = enc["input_ids"]
    attention_mask = enc["attention_mask"]
    if torch.cuda.is_available():
        input_ids = input_ids.cuda()
        attention_mask = attention_mask.cuda()

    # Extra features
    feats = build_features(prompt, answer)
    feats_tensor = torch.tensor(feats, dtype=torch.float32).unsqueeze(0)
    if torch.cuda.is_available():
        feats_tensor = feats_tensor.cuda()

    # Forward
    outputs = model(
        input_ids=input_ids,
        attention_mask=attention_mask,
        features=feats_tensor
    )
    score = outputs.logits.squeeze(-1).cpu().item()

    # Map ke band 5.0–9.0
    band = 5.0 + 4.0 * np.clip(score, 0.0, 1.0)
    band = round(band * 2) / 2  # 0.5 step

    return {
        "coherence_score": round(score, 4),
        "coherence_band": band,
        "features": {
            "qa_similarity": round(feats[0], 4),
            "adjacent_similarity": round(feats[1], 4),
            "connector_density": round(feats[2], 4)
        }
    }