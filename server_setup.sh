#!/bin/bash
# BilimAI - ISPManager serverda backend o'rnatish skripti
# Bir marta SSH orqali bajarish kerak
# Ishlatish: bash server_setup.sh

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() { echo -e "${GREEN}[✓]${NC} $1"; }
warn() { echo -e "${YELLOW}[!]${NC} $1"; }
info() { echo -e "${BLUE}[→]${NC} $1"; }
error() { echo -e "${RED}[✗]${NC} $1"; exit 1; }

echo ""
echo "=============================================="
echo "  BilimAI Backend - Server O'rnatish Skripti"
echo "  bilim-ai.uz uchun"
echo "=============================================="
echo ""

# ── 1. Python tekshirish ──────────────────────────
info "Python tekshirilmoqda..."
if ! command -v python3 &>/dev/null; then
    info "Python3 o'rnatilmoqda..."
    apt-get update -qq && apt-get install -y python3 python3-pip python3-venv -qq
fi
log "Python: $(python3 --version)"

# ── 2. Backend papkasi ────────────────────────────
BACKEND_DIR="/opt/bilimai-backend"
info "Backend papkasi: $BACKEND_DIR"
mkdir -p "$BACKEND_DIR"
mkdir -p "$BACKEND_DIR/data"

# Backend fayllarini nusxalash
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [ -d "$SCRIPT_DIR/backend/app" ]; then
    cp -r "$SCRIPT_DIR/backend/app" "$BACKEND_DIR/"
    cp "$SCRIPT_DIR/backend/requirements.txt" "$BACKEND_DIR/"
    log "Backend fayllari nusxalandi"
else
    error "Backend papkasi topilmadi! Skriptni loyiha root papkasidan ishlatish kerak."
fi

# ── 3. .env fayli ────────────────────────────────
if [ ! -f "$BACKEND_DIR/.env" ]; then
    if [ -f "$SCRIPT_DIR/backend/.env" ]; then
        cp "$SCRIPT_DIR/backend/.env" "$BACKEND_DIR/.env"
        log ".env fayli nusxalandi"
    else
        warn ".env fayli topilmadi, default yaratilmoqda..."
        cat > "$BACKEND_DIR/.env" << 'ENVEOF'
APP_NAME=BilimAI
ENVIRONMENT=production
DEBUG=false
DATABASE_URL=sqlite:////opt/bilimai-backend/data/bilimai.db
JWT_SECRET_KEY=CHANGE_THIS_SECRET_KEY_PLEASE
JWT_ALGORITHM=HS256
JWT_EXPIRE_MINUTES=1440
OPENAI_API_KEY=YOUR_GEMINI_API_KEY_HERE
OPENAI_BASE_URL=https://generativelanguage.googleapis.com/v1beta/openai/
OPENAI_MODEL=gemini-2.0-flash
CORS_ORIGINS=https://bilim-ai.uz,https://www.bilim-ai.uz,http://localhost:3000
CORS_ORIGIN_REGEX=^https?://(bilim-ai\.uz|www\.bilim-ai\.uz|localhost|127\.0\.0\.1)(:\d+)?$
ENVEOF
        warn "Muhim: $BACKEND_DIR/.env faylini tahrirlang va OPENAI_API_KEY ni kiriting!"
    fi
fi

# DATABASE_URL ni to'g'rilash
sed -i "s|DATABASE_URL=.*|DATABASE_URL=sqlite:////opt/bilimai-backend/data/bilimai.db|g" "$BACKEND_DIR/.env"
log ".env konfiguratsiya to'g'rilandi"

# ── 4. Virtual environment ────────────────────────
info "Python virtual environment yaratilmoqda..."
python3 -m venv "$BACKEND_DIR/venv"
source "$BACKEND_DIR/venv/bin/activate"
pip install --upgrade pip -q
pip install -r "$BACKEND_DIR/requirements.txt" -q
deactivate
log "Python packages o'rnatildi"

# ── 5. Systemd service ────────────────────────────
info "Systemd service yaratilmoqda..."
cat > /etc/systemd/system/bilimai-backend.service << SERVICEEOF
[Unit]
Description=BilimAI Backend (FastAPI)
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/opt/bilimai-backend
EnvironmentFile=/opt/bilimai-backend/.env
ExecStart=/opt/bilimai-backend/venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8000 --workers 2
Restart=always
RestartSec=5
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
SERVICEEOF

# Ruxsatlar
chown -R www-data:www-data "$BACKEND_DIR"
chmod 600 "$BACKEND_DIR/.env"

# Service ishga tushirish
systemctl daemon-reload
systemctl enable bilimai-backend
systemctl start bilimai-backend
sleep 2

if systemctl is-active --quiet bilimai-backend; then
    log "Backend service ishga tushdi!"
else
    warn "Backend service muammosi. Logni tekshiring: journalctl -u bilimai-backend -n 30"
fi

# ── 6. Nginx config ───────────────────────────────
info "Nginx konfiguratsiya ko'rsatmalari..."
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  ISPManager → Saytlar → bilim-ai.uz"
echo "  → Konfiguratsiya → Nginx satrlariga QOʻSHING:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo '  location /api/ {'
echo '      proxy_pass http://127.0.0.1:8000;'
echo '      proxy_set_header Host $host;'
echo '      proxy_set_header X-Real-IP $remote_addr;'
echo '      proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;'
echo '      proxy_set_header X-Forwarded-Proto $scheme;'
echo '      proxy_read_timeout 300s;'
echo '      client_max_body_size 50M;'
echo '  }'
echo ''
echo '  location /docs {'
echo '      proxy_pass http://127.0.0.1:8000/docs;'
echo '      proxy_set_header Host $host;'
echo '  }'
echo ''
echo '  location /health {'
echo '      proxy_pass http://127.0.0.1:8000/health;'
echo '  }'
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# ── 7. Tekshirish ─────────────────────────────────
log "Health check..."
sleep 1
if curl -s http://127.0.0.1:8000/health | grep -q "ok"; then
    log "Backend muvaffaqiyatli ishlayapti!"
    log "API URL: http://127.0.0.1:8000/api/v1"
else
    warn "Backend hali tayyor emas. Logni tekshiring:"
    warn "  journalctl -u bilimai-backend -n 50"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
log "Backend o'rnatish tugadi!"
echo ""
echo "  Keyingi qadamlar:"
echo "  1. $BACKEND_DIR/.env da OPENAI_API_KEY ni kiriting"
echo "  2. systemctl restart bilimai-backend"
echo "  3. ISPManager da nginx config qo'shing (yuqoridagi)"
echo "  4. Frontend fayllarini /www/bilim-ai.uz/ ga yuklang"
echo ""
echo "  Foydali buyruqlar:"
echo "  systemctl status bilimai-backend     # holat"
echo "  journalctl -u bilimai-backend -f     # loglar"
echo "  systemctl restart bilimai-backend    # qayta ishga tushirish"
echo ""
