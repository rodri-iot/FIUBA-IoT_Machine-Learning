import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// En desarrollo, /api se proxea a la API local: `uvicorn api.index:app --port 8000`
// (o a `vercel dev`).
export default defineConfig({
  plugins: [react()],
  // FastAPI en Vercel sirve public/ desde el CDN
  build: { outDir: '../public', emptyOutDir: true },
  server: { proxy: { '/api': 'http://localhost:8000' } },
})
