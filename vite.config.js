import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Keep the source question-bank HTML files where they already are.
  // Vite serves this directory as static assets in development and production.
  publicDir: 'questionbanks',
})
