#!/bin/bash
# BilimAI - Lokal Build Skripti
# Mac'da ishlatiladi: bash build_for_upload.sh
# Natija: upload/ papkasidagi fayllarni File Manager'ga tashlaysiz

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() { echo -e "${GREEN}[✓]${NC} $1"; }
warn() { echo -e "${YELLOW}[!]${NC} $1"; }
info() { echo -e "${BLUE}[→]${NC} $1"; }

echo ""
echo "========================================"
echo "  BilimAI - Upload uchun Build Qilish"
echo "========================================"
echo ""

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FRONTEND_DIR="$SCRIPT_DIR/frontend"
OUT_DIR="$SCRIPT_DIR/upload"

# Eski build tozalash
info "Eski build tozalanmoqda..."
rm -rf "$OUT_DIR"
rm -rf "$FRONTEND_DIR/.next"
rm -rf "$FRONTEND_DIR/out"
mkdir -p "$OUT_DIR"

# Node.js tekshirish
if ! command -v node &>/dev/null; then
    echo -e "${RED}[✗]${NC} Node.js topilmadi! https://nodejs.org dan o'rnating."
    exit 1
fi
log "Node.js: $(node --version)"

# .env.local tekshirish
if [ ! -f "$FRONTEND_DIR/.env.local" ]; then
    warn ".env.local topilmadi, yaratilmoqda..."
    echo "NEXT_PUBLIC_API_BASE_URL=https://bilim-ai.uz/api/v1" > "$FRONTEND_DIR/.env.local"
fi

# npm packages
info "npm packages o'rnatilmoqda..."
cd "$FRONTEND_DIR"
npm install --silent

# Production build
info "Production build qilinmoqda (1-2 daqiqa)..."
npm run build

# out/ papkasini tekshirish
if [ ! -d "$FRONTEND_DIR/out" ]; then
    echo -e "${RED}[✗]${NC} Build muvaffaqiyatsiz! 'out' papkasi yaratilmadi."
    exit 1
fi

# Upload papkasiga ko'chirish
info "Upload papkasiga ko'chirilmoqda..."
cp -r "$FRONTEND_DIR/out/." "$OUT_DIR/"

# ZIP yaratish
info "ZIP arxivi yaratilmoqda..."
cd "$SCRIPT_DIR"
zip -r "bilim-ai-frontend.zip" "upload/" -q

FILE_COUNT=$(find "$OUT_DIR" | wc -l | tr -d ' ')
ZIP_SIZE=$(du -sh "bilim-ai-frontend.zip" | cut -f1)

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
log "Build muvaffaqiyatli tugadi!"
echo ""
echo "  📁 Fayllar: $SCRIPT_DIR/upload/ ($FILE_COUNT ta)"
echo "  📦 ZIP:     $SCRIPT_DIR/bilim-ai-frontend.zip ($ZIP_SIZE)"
echo ""
echo "  📤 Yuklash yo'riqnomasi:"
echo ""
echo "  ISPManager → Menеjer fayllar → /www/bilim-ai.uz/"
echo "  → Barchani o'chirib, upload/ ichidagi fayllarni tashlang"
echo ""
echo "  YOKI: bilim-ai-frontend.zip ni yuklang,"
echo "        keyin ISPManager da arxivni oching"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Finder da ochish (Mac'da)
if command -v open &>/dev/null; then
    open "$SCRIPT_DIR"
fi
