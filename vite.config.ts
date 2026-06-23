import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      // En local, redirige /api/* al servidor de funciones de Vercel CLI
      // Ejecuta: npx vercel dev   (en vez de npm run dev) para usar las funciones
      // O usa: TROPIPAY_CLIENT_ID=xxx npx ts-node api/tropipay.ts para pruebas directas
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
});
