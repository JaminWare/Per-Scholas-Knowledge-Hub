import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/Per-Scholas-Knowledge-Hub/',
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
