# BilimAI arxitekturasi

## 1. Mahsulot g‘oyasi

BilimAI odatiy "AI kurs generatori" emas. U quyidagi zanjirni bajaradi:

1. manbani tushunadi
2. kurs strukturasini quradi
3. dars kontentini yaratadi
4. talabaning tushunganini isbotlaydi
5. o‘qituvchi va ota-onaga aniq signal beradi

## 2. Backend qatlamlari

### `api`
FastAPI routerlari:
- `auth`
- `courses`
- `lessons`
- `ai`
- `analytics`

### `core`
- config
- database
- security
- deps
- error handling

### `models`
Asosiy obyektlar:
- `User`
- `Course`
- `CourseModule`
- `Lesson`
- `Enrollment`
- `Progress`
- `ProofSession`
- `TutorMessage`

### `services`
Biznes logika shu yerda:
- `documents.py` — fayllarni matnga o‘tkazish va chunklash
- `openai_service.py` — barcha real AI chaqiriqlari
- `course_service.py` — kurs yaratish va kontent yozish
- `analytics_service.py` — teacher/parent insight

## 3. Frontend qatlamlari

### `app`
Sahifalar:
- landing
- login
- teacher dashboard
- teacher course builder
- student dashboard
- student lesson view
- SHOGIRD AI
- Bilim MRI
- parent dashboard

### `components`
Qayta ishlatiladigan UI bloklari:
- `DashboardShell`
- `CourseCard`
- `StatCard`
- `LoadingState`

### `features`
Rolga xos UI mantiqi:
- auth
- teacher
- student
- parent

### `services`
Frontend API qatlami:
- tokenni saqlash
- backendga so‘rov yuborish
- xatolarni normalizatsiya qilish

## 4. AI oqimi

### Kurs strukturasi
Teacher fayl yoki prompt yuboradi.
Backend:
- faylni parse qiladi
- chunklarga bo‘ladi
- OpenAI orqali strukturani yaratadi
- DB ga saqlaydi

### Kontent generatsiyasi
Teacher tasdiqlagandan keyin:
- har bir lesson uchun real AI chaqiruvi
- intro, nazariya, misol, amaliy qism, xulosa
- concept graph va source refs saqlanadi

### SHOGIRD AI
Student darsdan keyin:
- sessiya boshlaydi
- AI o‘quvchi xatoli tushuncha bilan gapni boshlaydi
- student tushuntiradi
- AI follow-up beradi
- pass bo‘lsa progress yangilanadi

### Bilim MRI
Student:
- AI yaratgan concept graph asosida candidate edges oladi
- bog‘lanishlarni tanlaydi
- backend to‘g‘ri/noto‘g‘rini solishtiradi
- OpenAI qisqa feedback yozadi
- pass bo‘lsa progress yangilanadi

## 5. Nega bu production-ready yo‘l?

- AI kaliti faqat backendda
- rollar ajratilgan
- ma’lumotlar DB da saqlanadi
- UI light-mode va SaaS uslubida
- har bir yirik funksiya alohida endpointga ega
- mock ma’lumotlar asosiy feature oqimiga aralashmaydi
