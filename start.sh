#!/usr/bin/env bash
set -e
cd "$(dirname "$0")"
command -v node >/dev/null 2>&1 || { echo "Chưa cài Node.js. Tải bản LTS tại https://nodejs.org rồi chạy lại."; exit 1; }
[ -d node_modules ] || { echo "Đang cài đặt thư viện lần đầu..."; npm install; }
npm run build
node server/index.js
