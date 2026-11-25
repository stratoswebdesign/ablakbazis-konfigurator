import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// relatív alap: GitHub Pages alútvonalon (/ablakbazis-konfigurator/) és bárhol máshol is működik
export default defineConfig({
  plugins: [react()],
  base: './',
  build: { chunkSizeWarningLimit: 1400 },
});
