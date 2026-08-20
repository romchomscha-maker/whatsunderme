import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  /*
   * GitHub Pages liefert das Projekt unter /<repo-name>/ aus, Vercel und
   * Netlify unter /. Deshalb ist der Basispfad einstellbar: der Pages-Workflow
   * setzt VITE_BASE, überall sonst bleibt es bei "/".
   */
  base: process.env.VITE_BASE ?? '/',
})
