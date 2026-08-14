# BilimAI

<p align="center">
  <img src="./docs/assets/logo.png" alt="BilimAI logo" width="180" />
</p>

<p align="center">
  <strong>More than content delivery — We prove real understanding</strong><br/>
  AI-powered verifiable learning platform
</p>

<p align="center">
  <a href="https://bilim-ai.uz"><img src="https://img.shields.io/badge/🌐_Demo_Site-bilim--ai.uz-4f8ef7?style=for-the-badge" alt="Demo"/></a>
  <img src="https://img.shields.io/badge/Stack-FastAPI_+_Next.js-7c3aed?style=for-the-badge" alt="Stack"/>
  <img src="https://img.shields.io/badge/AI-Gemini_2.0_Flash-10b981?style=for-the-badge" alt="AI"/>
</p>

---

## 🌐 Demo Site

**[https://bilim-ai.uz](https://bilim-ai.uz)**

### Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| 👨‍🏫 Teacher | `teacher@bilimai.local` | `password123` |
| 🎓 Student | `student@bilimai.local` | `password123` |
| 👨‍👩‍👦 Parent | `parent@bilimai.local` | `password123` |

> Full AI functionality is available on the demo site, powered by Gemini 2.0 Flash.

---

## 🎯 About the Project

BilimAI is an EdTech SaaS platform designed to answer one critical question: **Did the student truly understand the topic, or merely complete the lesson?**

**Key Features:**

| Feature | Description |
|---------|-------------|
| 🤖 **AI Course Generation** | Generates full courses via Gemini AI using prompts, PDFs, or DOCX files |
| 🎓 **SHOGIRD AI** | The student "teaches" an AI persona — uncovering superficial knowledge |
| 🧠 **Bilim MRI** | Evaluates internal knowledge structures via conceptual graphs |
| 📊 **Analytics** | Real-time dashboards for teachers and parents |

---

## 🛠️ Tech Stack

### Backend
- **FastAPI** + SQLAlchemy + SQLite
- **JWT** Authentication
- **Gemini API** (OpenAI-compatible endpoint)
- PDF, DOCX, PPTX, TXT file parsing

### Frontend
- **Next.js 16** App Router + TypeScript
- React 19

### DevOps
- Docker Compose
- Nginx reverse proxy

---

## 🚀 Quick Start

### With Docker (Recommended)

```bash
git clone https://github.com/mnekboyev99-1/bilimai
cd bilimai

# 1. Setup Backend Environment
cp backend/.env.example backend/.env
# Set your OPENAI_API_KEY to your Gemini API key

# 2. Setup Frontend Environment
cp frontend/.env.example frontend/.env.local

# 3. Launch
docker compose up --build
```

| URL | Description |
|-----|-------------|
| `http://localhost:3000` | Frontend |
| `http://localhost:8000` | Backend API |
| `http://localhost:8000/docs` | Swagger UI |

### Local (Without Docker)

**Backend:**
```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload
```

**Frontend:**
```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

---

## ⚙️ Configuration

### Gemini API (Required for AI Features)

```env
OPENAI_API_KEY=YOUR_GEMINI_API_KEY    # Get from aistudio.google.com
OPENAI_BASE_URL=https://generativelanguage.googleapis.com/v1beta/openai/
OPENAI_MODEL=gemini-2.0-flash
```

### CORS (For Production)
```env
CORS_ORIGINS=https://bilim-ai.uz,https://www.bilim-ai.uz
```

---

## 📁 Project Structure

```
bilimai/
├── backend/
│   ├── app/
│   │   ├── api/         # API endpoints
│   │   ├── core/        # config, auth, db
│   │   ├── models/      # SQLAlchemy models
│   │   ├── schemas/     # Pydantic schemas
│   │   └── services/    # AI, analytics, courses
│   └── requirements.txt
├── frontend/
│   ├── app/             # Next.js App Router pages
│   │   ├── teacher/     # Teacher dashboard
│   │   ├── student/     # Student dashboard
│   │   └── parent/      # Parent dashboard
│   ├── components/      # UI components
│   ├── features/        # Auth, business logic
│   └── services/        # API client
├── nginx/               # Nginx configuration
├── docker-compose.yml
└── deploy.sh            # Production deploy script
```

---

## 🗺️ Roadmap

- [ ] PostgreSQL + Alembic migrations
- [ ] S3-compatible File Storage
- [ ] Celery Background workers
- [ ] Multi-tenant organizations
- [ ] Mobile app (React Native)
- [ ] Audit logging and observability

---

## 📄 License

This project is intended for personal and internal use.

---

<p align="center">
  <a href="https://bilim-ai.uz">bilim-ai.uz</a> · 
  Made with ❤️ in Uzbekistan
</p>
