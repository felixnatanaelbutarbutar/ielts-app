# backend_app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# HAPUS: sessions
from backend_app.routes import topics, asr

from backend_app.db.session import engine
from backend_app.db.base import Base
from backend_app.db import models_base  # noqa: F401  # register tabel

app = FastAPI(title="IELTS Speaking Backend", version="0.1.0")

# CORS (dev)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# HAPUS: app.include_router(sessions.router)

@app.on_event("startup")
def on_startup():
    # Buat tabel otomatis
    Base.metadata.create_all(bind=engine)

@app.get("/health")
def health():
    return {"status": "ok"}

@app.get("/")
def root():
    return {"message": "IELTS Backend API is running successfully"}

# ROUTES YANG DIPAKAI
app.include_router(topics.router)
app.include_router(asr.router)