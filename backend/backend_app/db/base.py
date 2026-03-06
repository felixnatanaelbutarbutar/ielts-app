# backend_app/db/base.py
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+psycopg2://postgres:felixexe131105@localhost:5432/ielts_backend"
)

# SUPER CEPAT — HAPUS echo, pool_pre_ping, dan create_all di sini!
engine = create_engine(
    DATABASE_URL,
    pool_size=5,          # kecil aja cukup
    max_overflow=10,
    pool_timeout=30,
    echo=False            # MATIKAN LOG SQL!
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# JANGAN BUAT TABEL DI SINI LAGI!
# Base.metadata.create_all(bind=engine) ← HAPUS BARIS INI KALAU ADA

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()