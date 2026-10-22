import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Build output: dist/ — deploy that folder to Cloudflare Pages
// (project: fsg-minerals, custom domain fsgminerals.trade).
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
})
