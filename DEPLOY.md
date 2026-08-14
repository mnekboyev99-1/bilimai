# BilimAI - bilim-ai.uz ga Deploy Qo'llanmasi

## Tayyorgarlik

### 1. sysdc.uz serveriga SSH orqali ulaning
```bash
ssh username@your-server-ip
# yoki
ssh username@bilim-ai.uz
```

### 2. Docker o'rnating (agar yo'q bo'lsa)
```bash
# Docker o'rnatish
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
newgrp docker

# Docker Compose o'rnatish
sudo apt install docker-compose-plugin -y

# Tekshirish
docker --version
docker compose version
```

### 3. Loyihani serverga yuklash

**Variant A: GitHub orqali (tavsiya etiladi)**
```bash
cd /home/$USER
git clone https://github.com/mnekboyev99-1/bilimai
cd bilimai
```

**Variant B: SCP orqali (lokal kompyuterdan)**
```bash
# Lokal kompyuterda bajaring:
scp -r /Users/mnekboyev/bilimai username@server-ip:/home/username/bilimai
```

---

## Konfiguratsiya

### 4. Gemini API kalitini qo'shing
```bash
cd /home/$USER/bilimai
nano backend/.env
```

Quyidagi satrni o'zgartiring:
```
OPENAI_API_KEY=YOUR_GEMINI_API_KEY_HERE
```
→
```
OPENAI_API_KEY=AIzaSy....(sizning kalit)
```

Saqlash: `Ctrl+X` → `Y` → `Enter`

---

## Deploy

### 5. Deploy skriptini ishga tushiring
```bash
chmod +x deploy.sh
bash deploy.sh
```

Sayt http://bilim-ai.uz da ishlaydi.

---

## SSL (HTTPS) Qo'shish

### 6. Certbot o'rnating va SSL oling
```bash
# Certbot o'rnatish
sudo apt install certbot -y

# Avval 80-port bo'sh bo'lishi kerak, nginx ni to'xtating
docker stop bilimai_nginx 2>/dev/null || true

# SSL sertifikat olish
sudo certbot certonly --standalone -d bilim-ai.uz -d www.bilim-ai.uz \
    --email your@email.com --agree-tos --non-interactive

# SSL fayllarni nusxalash
mkdir -p nginx/ssl
sudo cp /etc/letsencrypt/live/bilim-ai.uz/fullchain.pem nginx/ssl/
sudo cp /etc/letsencrypt/live/bilim-ai.uz/privkey.pem nginx/ssl/
sudo chmod 644 nginx/ssl/*.pem

# Qaytadan deploy qiling (endi HTTPS bilan)
bash deploy.sh
```

---

## Kerakli Buyruqlar

### Loglarni ko'rish
```bash
docker compose logs -f              # hammasi
docker compose logs -f backend      # faqat backend
docker compose logs -f frontend     # faqat frontend
docker compose logs -f nginx        # faqat nginx
```

### Servislarni qayta ishga tushirish
```bash
docker compose restart              # hammasi
docker compose restart backend      # faqat backend
```

### Yangilash (yangi kod olgandan keyin)
```bash
git pull
bash deploy.sh
```

### Servislar holatini ko'rish
```bash
docker compose ps
```

### To'xtatish
```bash
docker compose down
```

---

## Muammolar

### Sayt ochilmaydi
```bash
# 80-port tekshirish
sudo netstat -tlnp | grep :80
# yoki
sudo ss -tlnp | grep :80
```

### Backend ishlamaydi
```bash
docker compose logs backend
# .env faylida OPENAI_API_KEY to'g'ri ekanligini tekshiring
```

### Ma'lumotlar bazasi muammosi
```bash
# backend-data papkasini tekshiring
ls -la backend-data/
docker compose exec backend ls -la /app/data/
```

---

## URL manzillar

| Xizmat | URL |
|--------|-----|
| 🌐 Sayt | https://bilim-ai.uz |
| 📡 API | https://bilim-ai.uz/api/v1 |
| 📚 API Docs | https://bilim-ai.uz/docs |
| ❤️ Health | https://bilim-ai.uz/health |
