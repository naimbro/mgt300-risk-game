import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/mgt300-risk-game/',
  // En producción se eliminan los console.log de depuración.
  esbuild: process.env.NODE_ENV === 'production' ? { pure: ['console.log'] } : {},
  server: {
    // El repo vive en /mnt/c y Vite corre en WSL: sin polling, los cambios no se ven.
    watch: { usePolling: true, interval: 300 },
  },
  test: {
    include: ['src/**/*.test.ts'],
  },
})
