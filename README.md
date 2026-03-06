# 🎓 IELTS Speaking Practice App

An AI-powered web application designed to help students practice and assess their **IELTS Speaking** skills. The system provides real-time speech recognition (ASR), coherence analysis using a fine-tuned DeBERTa model, and structured feedback aligned with IELTS band descriptors.

---

## 🌐 Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 15, React 19, TypeScript, Tailwind CSS, NextAuth.js |
| **Backend API** | Python, FastAPI, SQLAlchemy, PostgreSQL |
| **ML / AI** | Fine-tuned DeBERTa (coherence scoring), ASR integration |
| **Rules Engine** | Separate FastAPI service (`rules_app`) |
| **Auth** | NextAuth.js (JWT-based) |

---

## 📁 Project Structure

```
ielts-app/
├── backend/                    # Python FastAPI backend
│   ├── backend_app/            # Main API application
│   │   ├── db/                 # Database models & session
│   │   ├── routes/             # API route handlers (topics, asr, coherence, sessions)
│   │   └── services/           # Business logic
│   ├── models/                 # ML model files (NOT included – see note below)
│   │   └── deberta_model_final/ # Fine-tuned DeBERTa weights
│   ├── rules_app/              # Separate rules-based scoring service
│   └── requirements.txt        # Python dependencies
│
├── frontend/                   # Next.js frontend app
│   ├── src/                    # Application source code
│   ├── public/                 # Static assets
│   ├── package.json
│   └── tsconfig.json
│
├── topic&questions.sql         # Database seed: topics & questions
├── aan.json                    # Additional config / data
└── deployment.mmd              # Deployment architecture diagram (Mermaid)
```

---

## ⚙️ Prerequisites

- **Node.js** ≥ 18 and **npm** ≥ 9
- **Python** ≥ 3.10
- **PostgreSQL** ≥ 14
- Fine-tuned **DeBERTa model** files (see [Model Files](#-model-files) below)

---

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/felixnatanaelbutarbutar/ielts-app.git
cd ielts-app
```

### 2. Database Setup

Create a PostgreSQL database and seed it:

```bash
psql -U postgres -c "CREATE DATABASE \"ielts-database\";"
psql -U postgres -d ielts-database -f "topic&questions.sql"
```

### 3. Backend Setup

```bash
cd backend

# Create & activate virtual environment
python -m venv venv
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment variables
copy .env.example .env    # Windows
# cp .env.example .env    # macOS/Linux
# Edit .env with your credentials (see Environment Variables section)

# Run the backend
uvicorn backend_app.main:app --reload --port 8000
```

### 4. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Configure environment variables
copy .env.example .env.local    # Windows
# cp .env.example .env.local    # macOS/Linux
# Edit .env.local with your values

# Run the development server
npm run dev
```

The app will be available at **http://localhost:3000**.

---

## 🔐 Environment Variables

### Backend (`backend/.env`)

Create `backend/.env` based on this template:

```env
# Database
DATABASE_URL=postgresql+psycopg2://<user>:<password>@localhost:5432/ielts-database

# NextAuth (should match frontend)
NEXTAUTH_SECRET=<your-secret-key>
NEXTAUTH_URL=http://localhost:3000
```

### Frontend (`frontend/.env.local`)

Create `frontend/.env.local` based on this template:

```env
NEXTAUTH_SECRET=<your-secret-key>
NEXTAUTH_URL=http://localhost:3000

# Backend API base URL
NEXT_PUBLIC_API_URL=http://localhost:8000
```

> **⚠️ Never commit `.env` files to version control.**

---

## 🤖 Model Files

The fine-tuned DeBERTa model (`backend/models/`) is **NOT included** in this repository due to GitHub's 100 MB file size limit. Model weight files include:

| File | Size |
|---|---|
| `model.safetensors` | ~702 MB |
| `pytorch_model.bin` | ~703 MB |
| `regression_head.bin` | ~2.3 MB |
| Tokenizer files | ~3 MB |

> 📥 **Download the model files** from: *(link to be added — e.g., Google Drive / HuggingFace Hub)*

After downloading, place the files in:

```
backend/models/deberta_model_final/
```

---

## 📡 API Endpoints

The backend runs on `http://localhost:8000`.

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | Health check |
| `GET` | `/health` | Service status |
| `GET` | `/topics` | List all speaking topics |
| `POST` | `/asr` | Submit audio for transcription |
| `POST` | `/coherence` | Score coherence of a response |
| `POST` | `/sessions` | Create a new practice session |

Full interactive API docs: **http://localhost:8000/docs**

---

## 🗃️ Database

The app uses **PostgreSQL**. Run the SQL seed file to initialize topics and questions:

```bash
psql -U postgres -d ielts-database -f "topic&questions.sql"
```

Tables are auto-created by SQLAlchemy on startup via `Base.metadata.create_all()`.

---

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────────────┐
│                        Browser                          │
│              Next.js (React 19 + TypeScript)            │
└───────────────────────┬──────────────────────────────────┘
                        │ HTTP / REST
          ┌─────────────┴─────────────┐
          │                           │
┌─────────▼──────────┐   ┌────────────▼───────────┐
│  FastAPI Backend   │   │    NextAuth.js (JWT)   │
│  (Port 8000)       │   │    Authentication      │
└─────────┬──────────┘   └────────────────────────┘
          │
    ┌─────┴──────────────────────┐
    │                            │
┌───▼────────┐     ┌────────────▼──────────┐
│ PostgreSQL │     │  DeBERTa Model        │
│ Database   │     │  (Coherence Scoring)  │
└────────────┘     └───────────────────────┘
```

---

## 🛠️ Development Scripts

### Backend
```bash
# Run with auto-reload
uvicorn backend_app.main:app --reload --port 8000

# Run rules service (if applicable)
uvicorn rules_app.main:app --reload --port 8001
```

### Frontend
```bash
npm run dev      # Start dev server (Turbopack)
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

---

## 📝 License

This project is developed as a **Final Year Thesis (Tugas Akhir)** project. All rights reserved.

---

## 👤 Author

**Felix Natanael Butarbutar**  
Semester 5 – Final Year Project
