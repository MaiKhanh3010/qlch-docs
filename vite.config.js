import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { createApi } from './server/api.js';

/** Gắn API (/api, /uploads) trực tiếp vào Vite – chỉ cần chạy `npm run dev` */
function qlchApi() {
  return {
    name: 'qlch-api',
    configureServer(server) { server.middlewares.use(createApi()); },
    configurePreviewServer(server) { server.middlewares.use(createApi()); },
  };
}

export default defineConfig({
  plugins: [react(), qlchApi()],
  server: {
    port: 5173,
    host: true,
    // Không reload trang khi lưu nội dung / tải ảnh
    watch: { ignored: ['**/data/**', '**/uploads/**'] },
  },
  preview: { port: 4173 },
});
