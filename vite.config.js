import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/corridor/',
  server: {
    host: true // LAN üzerinden erişim için
  }
})
