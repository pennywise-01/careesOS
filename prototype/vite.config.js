import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import deepseekProxy from './vite-plugin-deepseek.js'

export default defineConfig({
  plugins: [react(), tailwindcss(), deepseekProxy()],
})
