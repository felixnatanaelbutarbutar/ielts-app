# backend_app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend_app.routes import sessions
from backend_app.db.session import engine
from backend_app.db.base import Base
from backend_app.db import models_base  # noqa: F401  # penting untuk register tabel

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

app.include_router(sessions.router)

@app.on_event("startup")
def on_startup():
    # Buat tabel otomatis saat app start (sebelum pakai Alembic)
    Base.metadata.create_all(bind=engine)

@app.get("/health")
def health():
    return {"status": "ok"}

@app.get("/")
def root():
    return {"message": "IELTS Backend API is running successfully 🚀"}
