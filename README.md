# BilimAI

<p align="center">
  <img src="./docs/assets/logo.png" alt="BilimAI logo" width="180" />
</p>

<p align="center">
  <strong>Bilim yetkazmaydi — Tushunganingizni isbotlatadi</strong><br/>
  AI-powered verifiable learning platform
</p>

<p align="center">
  <a href="https://bilim-ai.uz"><img src="https://img.shields.io/badge/🌐_Demo_Sayt-bilim--ai.uz-4f8ef7?style=for-the-badge" alt="Demo"/></a>
  <img src="https://img.shields.io/badge/Stack-FastAPI_+_Next.js-7c3aed?style=for-the-badge" alt="Stack"/>
  <img src="https://img.shields.io/badge/AI-Gemini_2.0_Flash-10b981?style=for-the-badge" alt="AI"/>
</p>

---

## 🌐 Demo Sayt

**[https://bilim-ai.uz](https://bilim-ai.uz)**

### Demo Hisoblar

| Rol | Email | Parol |
|-----|-------|-------|
| 👨‍🏫 O'qituvchi | `teacher@bilimai.local` | `password123` |
| 🎓 Talaba | `student@bilimai.local` | `password123` |
| 👨‍👩‍👦 Ota-ona | `parent@bilimai.local` | `password123` |

> Demo saytda AI funksiyalari to'liq ishlaydi. Gemini 2.0 Flash modeli ishlatilgan.

---

## 🎯 Loyiha Haqida

BilimAI — talabaning haqiqatan tushunganini isbotlashga asoslangan EdTech platformasi.

**Asosiy muammo:** Talaba darsni tugatdi, lekin aslida tushundimi?

**BilimAI yechimi:**

| Xususiyat | Tavsif |
|-----------|--------|
| 🤖 **AI Kurs Generatsiyasi** | Prompt yoki fayl (PDF/DOCX) asosida Gemini AI kurs yaratadi |
| 🎓 **SHOGIRD AI** | Talaba AI "o'quvchisini" o'qitadi — yuzaki javob ajratiladi |
| 🧠 **Bilim MRI** | Concept graph orqali ichki tushuncha tuzilmasi tekshiriladi |
| 📊 **Analytics** | O'qituvchi va ota-ona uchun real-time progress ko'rsatkichlari |

---

## 🛠️ Tech Stack

### Backend
- **FastAPI** + SQLAlchemy + SQLite
- **JWT** autentifikatsiya
- **Gemini API** (OpenAI-compatible endpoint)
- PDF, DOCX, PPTX, TXT fayl parsing

### Frontend
- **Next.js 16** App Router + TypeScript
- React 19

### DevOps
- Docker Compose
- Nginx reverse proxy

---

## 🚀 Ishga Tushirish

### Docker bilan (tavsiya)

```bash
git clone https://github.com/mnekboyev99-1/bilimai
cd bilimai

# 1. Backend .env yarating
cp backend/.env.example backend/.env
# OPENAI_API_KEY ga Gemini API kalitingizni kiriting

# 2. Frontend .env yarating
cp frontend/.env.example frontend/.env.local

# 3. Ishga tushiring
docker compose up --build
```

| URL | Tavsif |
|-----|--------|
| `http://localhost:3000` | Frontend |
| `http://localhost:8000` | Backend API |
| `http://localhost:8000/docs` | Swagger UI |

### Lokal (Docker siz)

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

## ⚙️ Konfiguratsiya

### Gemini API (tavsiya etiladi)

```env
OPENAI_API_KEY=YOUR_GEMINI_API_KEY    # aistudio.google.com dan oling
OPENAI_BASE_URL=https://generativelanguage.googleapis.com/v1beta/openai/
OPENAI_MODEL=gemini-2.0-flash
```

### CORS (production uchun)
```env
CORS_ORIGINS=https://bilim-ai.uz,https://www.bilim-ai.uz
```

---

## 📁 Loyiha Tuzilishi

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
│   ├── app/             # Next.js App Router sahifalari
│   │   ├── teacher/     # O'qituvchi paneli
│   │   ├── student/     # Talaba paneli
│   │   └── parent/      # Ota-ona paneli
│   ├── components/      # UI komponentlar
│   ├── features/        # Auth, business logic
│   └── services/        # API client
├── nginx/               # Nginx konfiguratsiya
├── docker-compose.yml
└── deploy.sh            # Production deploy skripti
```

---

## 🗺️ Roadmap

- [ ] PostgreSQL + Alembic migrations
- [ ] Fayl storage (S3-compatible)
- [ ] Background workers (Celery)
- [ ] Multi-tenant tashkilotlar
- [ ] Mobile app (React Native)
- [ ] Audit logging va observability

---

## 📄 Litsenziya

Ushbu loyiha shaxsiy va ichki foydalanish uchun mo'ljallangan.

---

<p align="center">
  <a href="https://bilim-ai.uz">bilim-ai.uz</a> · 
  Made with ❤️ in Uzbekistan
</p>
