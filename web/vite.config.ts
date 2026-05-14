/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
    fs: {
      allow: ['..'],
    },
  },
  // Aquí va la configuración de Vitest
  test: {
    globals: true, // Para usar describe, it, expect sin importarlos
    environment: 'jsdom', // Simula el navegador para probar componentes de React
    setupFiles: './src/setupTests.ts', // Archivo de configuración previa
  },
})