#!/usr/bin/env bash
# FreeCrawl SEO Tool — Launcher (macOS / Linux mirror of FreeCrawl-SEO-Tool-Start.bat)
#
# İlk çalıştırma:
#   1) chmod +x FreeCrawl-SEO-Tool-Start.sh
#   2) ./FreeCrawl-SEO-Tool-Start.sh
#
# .bat tarafındaki Windows-spesifik bölümler (color, title, pause) yerine
# burada ANSI renkleri + sondaki "Enter ile çık" promptu kullanılır.

set -u

# Çift-tıklatma ile başlatılan terminallerde script kendi dizininden bağımsız
# olarak fire edilebilir — symlink'i de takip ederek gerçek dizine cd ediyoruz.
SCRIPT_DIR="$(cd "$(dirname "$(readlink -f "${BASH_SOURCE[0]}" 2>/dev/null || echo "${BASH_SOURCE[0]}")")" && pwd)"
cd "$SCRIPT_DIR"

# Renk kısayolları — `tput` çıkışa terminal yoksa boş döner, böylece bir log
# dosyasına pipe'lansa bile escape kodları output'u kirletmez.
if [ -t 1 ]; then
  C_RESET="$(tput sgr0 2>/dev/null || echo)"
  C_OK="$(tput setaf 2 2>/dev/null || echo)"
  C_ERR="$(tput setaf 1 2>/dev/null || echo)"
  C_INFO="$(tput setaf 6 2>/dev/null || echo)"
  C_HEAD="$(tput setaf 14 2>/dev/null || tput setaf 6 2>/dev/null || echo)"
else
  C_RESET=""
  C_OK=""
  C_ERR=""
  C_INFO=""
  C_HEAD=""
fi

ok()    { printf '%s[OK]%s %s\n'    "$C_OK"   "$C_RESET" "$*"; }
info()  { printf '%s[BILGI]%s %s\n' "$C_INFO" "$C_RESET" "$*"; }
err()   { printf '%s[HATA]%s %s\n'  "$C_ERR"  "$C_RESET" "$*" >&2; }
head_() { printf '%s%s%s\n' "$C_HEAD" "$*" "$C_RESET"; }
hr()    { head_ "============================================================"; }
sub()   { head_ "------------------------------------------------------------"; }

# Çift-tıklatma akışlarında pencerenin anında kapanmaması için sondaki
# "Enter ile çık" promptu. Stdin TTY değilse (CI, pipe) atlanır.
final_pause() {
  if [ -t 0 ]; then
    printf '\n'
    read -r -p "Cikmak icin Enter'a basin..." _ || true
  fi
}

trap 'final_pause' EXIT

# ============================================================================
hr
head_ "  FreeCrawl SEO Tool - Launcher"
hr
echo

# ---- 1) Node.js kontrolu ----------------------------------------------------
if ! command -v node >/dev/null 2>&1; then
  err "Node.js bulunamadi."
  echo
  echo "FreeCrawl SEO Tool Node.js 22+ gerektirir."
  echo "Lutfen https://nodejs.org/ adresinden LTS surumunu indirip kurun."
  echo "Kurulumdan sonra bu betigi tekrar calistirin."
  exit 1
fi
NODE_VERSION="$(node -v)"
ok "Node.js bulundu: ${NODE_VERSION}"

# ---- 2) npm kontrolu --------------------------------------------------------
if ! command -v npm >/dev/null 2>&1; then
  err "npm bulunamadi. Node.js kurulumunuz bozuk olabilir."
  exit 1
fi
NPM_VERSION="$(npm -v)"
ok "npm bulundu: v${NPM_VERSION}"
echo

# ---- 3) Bagimlilik kontrolu -------------------------------------------------
NEED_INSTALL=0
[ -d "node_modules" ] || NEED_INSTALL=1
[ -d "apps/desktop/node_modules" ] || NEED_INSTALL=1
[ -d "node_modules/electron" ] || NEED_INSTALL=1

if [ "$NEED_INSTALL" -eq 1 ]; then
  info "Gerekli kutuphaneler yuklu degil veya eksik."
  echo
  echo "Bu islem ilk calistirmada birkac dakika surebilir ve yaklasik"
  echo "500-800 MB disk alani kullanir."
  echo
  CONFIRM=""
  read -r -p "Kutuphaneleri simdi yuklemek istiyor musunuz? (E/H): " CONFIRM || true
  case "${CONFIRM:-}" in
    E|e|Y|y)
      echo
      sub
      head_ "  npm install calisiyor..."
      sub
      if ! npm install; then
        err "npm install basarisiz oldu. Internet baglantinizi kontrol edin veya hata mesajini inceleyin."
        exit 1
      fi
      echo
      ok "Kutuphaneler basariyla yuklendi."
      echo
      ;;
    *)
      echo
      echo "Kurulum iptal edildi. Program baslatilamaz."
      exit 1
      ;;
  esac
else
  ok "Gerekli kutuphaneler yuklu."
  echo
fi

# ---- 4) Paylasilan workspace paketlerini derle ------------------------------
NEED_BUILD=0
[ -f "packages/shared-types/dist/index.js" ] || NEED_BUILD=1
[ -f "packages/db/dist/index.js" ] || NEED_BUILD=1
[ -f "packages/core/dist/index.js" ] || NEED_BUILD=1

if [ "$NEED_BUILD" -eq 1 ]; then
  sub
  head_ "  Paylasilan paketler derleniyor (ilk calisma)..."
  sub
  if ! npx tsc -b; then
    err "Paket derlemesi basarisiz oldu."
    exit 1
  fi
  ok "Paketler hazir."
  echo
else
  ok "Paylasilan paketler hazir."
  echo
fi

# ---- 4b) Desktop uygulamasini production build et ---------------------------
# Dev mod (electron-vite dev) ilk acilista 1700+ modulu on-demand transform
# ediyor ve 20-30 sn cold start suruyor. Production build'de tum moduller
# tek bir bundle'a derlenmis oldugu icin acilis 1-2 sn'ye iniyor.
NEED_DESKTOP_BUILD=0
[ -f "apps/desktop/out/main/index.js" ] || NEED_DESKTOP_BUILD=1
[ -f "apps/desktop/out/preload/index.js" ] || NEED_DESKTOP_BUILD=1
[ -f "apps/desktop/out/renderer/index.html" ] || NEED_DESKTOP_BUILD=1

if [ "$NEED_DESKTOP_BUILD" -eq 1 ]; then
  sub
  head_ "  Desktop uygulamasi build ediliyor (production)..."
  echo "  Bu islem yaklasik 10-15 sn surer ve sadece ilk calistirmada"
  echo "  (veya kod degisikligi sonrasi) yeniden yapilir."
  sub
  if ! npm --workspace apps/desktop run build; then
    err "Desktop build basarisiz oldu."
    exit 1
  fi
  ok "Desktop bundle hazir."
  echo
else
  ok "Desktop bundle hazir."
  echo
fi

# ---- 5) Uygulamayi baslat ---------------------------------------------------
hr
head_ "  FreeCrawl SEO Tool baslatiliyor (production)..."
echo "  Bu pencereyi KAPATMAYIN - uygulamanin yasam dongusu buna bagli."
hr
echo

# `node:sqlite` Node 24'te kararli ama hala "experimental" bayragi tasiyor
# ve modul yuklenirken ExperimentalWarning basiyor. NODE_NO_WARNINGS=1
# ile bu kozmetik uyariyi sustururuz; gercek hatalar (TypeError vs.)
# yine konsola yazilir.
export NODE_NO_WARNINGS=1

npm --workspace apps/desktop run start
APP_EXIT=$?

echo
sub
if [ "$APP_EXIT" -eq 0 ]; then
  head_ "  Uygulama kapatildi."
else
  err "Uygulama hatayla sonlandi (exit code: ${APP_EXIT})."
fi
sub

exit "$APP_EXIT"
