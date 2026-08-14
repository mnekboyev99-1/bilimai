#!/bin/bash
# BilimAI - bilim-ai.uz server deploy skripti
# Ishlatish: bash deploy.sh

set -e

echo "========================================"
echo "  BilimAI - bilim-ai.uz Deploy Skripti"
echo "========================================"

# Ranglar
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() { echo -e "${GREEN}[✓]${NC} $1"; }
warn() { echo -e "${YELLOW}[!]${NC} $1"; }
error() { echo -e "${RED}[✗]${NC} $1"; exit 1; }

# Docker tekshirish
if ! command -v docker &> /dev/null; then
    error "Docker o'rnatilmagan! Iltimos, Docker o'rnating."
fi

if ! command -v docker compose &> /dev/null && ! command -v docker-compose &> /dev/null; then
    error "Docker Compose o'rnatilmagan!"
fi

DOCKER_COMPOSE="docker compose"
if ! docker compose version &> /dev/null 2>&1; then
    DOCKER_COMPOSE="docker-compose"
fi

# backend/.env tekshirish
if [ ! -f "backend/.env" ]; then
    error "backend/.env fayli topilmadi! Iltimos, backend/.env faylini yarating."
fi

# Gemini API kalit tekshirish
if grep -q "YOUR_GEMINI_API_KEY_HERE" backend/.env; then
    error "backend/.env faylida OPENAI_API_KEY ni Gemini API kalitingiz bilan almashtiring!"
fi

log "Konfiguratsiya tekshirildi"

# SSL papka tekshirish
if [ ! -f "nginx/ssl/fullchain.pem" ] || [ ! -f "nginx/ssl/privkey.pem" ]; then
    warn "SSL sertifikat topilmadi. HTTP rejimida ishga tushirish..."
    
    # HTTP-only nginx config yaratish
    cat > nginx/nginx.conf << 'EOF'
server {
    listen 80;
    server_name bilim-ai.uz www.bilim-ai.uz _;

    client_max_body_size 50M;

    gzip on;
    gzip_types text/plain text/css application/json application/javascript;

    location /api/ {
        proxy_pass http://backend:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_read_timeout 300s;
    }

    location /health {
        proxy_pass http://backend:8000/health;
    }

    location /docs {
        proxy_pass http://backend:8000/docs;
        proxy_set_header Host $host;
    }

    location / {
        proxy_pass http://frontend:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    location /_next/static/ {
        proxy_pass http://frontend:3000/_next/static/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
EOF
    
    # SSL bo'lgan nginx bilan deploy qilmaslik
    $DOCKER_COMPOSE up -d --build backend frontend
    
    # nginx ni HTTP-only rejimida ishga tushirish (SSL portlarsiz)
    docker run -d \
        --name bilimai_nginx \
        --network "$(basename $(pwd))_default" \
        -p 80:80 \
        -v $(pwd)/nginx/nginx.conf:/etc/nginx/conf.d/default.conf:ro \
        --restart always \
        nginx:alpine 2>/dev/null || \
    docker start bilimai_nginx 2>/dev/null || true
    
    log "HTTP rejimida ishga tushirildi: http://bilim-ai.uz"
    warn ""
    warn "SSL qo'shish uchun quyidagi buyruqlarni bajaring:"
    warn "  1. sudo apt install certbot python3-certbot-nginx"
    warn "  2. sudo certbot --nginx -d bilim-ai.uz -d www.bilim-ai.uz"
    warn "  3. SSL fayllarni nginx/ssl/ papkasiga nusxalang"
    warn "  4. bash deploy.sh (qaytadan)"
else
    log "SSL sertifikatlar topildi"
    $DOCKER_COMPOSE up -d --build
    log "HTTPS rejimida ishga tushirildi: https://bilim-ai.uz"
fi

echo ""
log "Deploy muvaffaqiyatli tugadi!"
echo ""
echo "  🌐 Sayt:    http://bilim-ai.uz"
echo "  📡 API:     http://bilim-ai.uz/api/v1"
echo "  📚 Docs:    http://bilim-ai.uz/docs"
echo "  ❤️  Health: http://bilim-ai.uz/health"
echo ""
log "Loglarni ko'rish: docker compose logs -f"
