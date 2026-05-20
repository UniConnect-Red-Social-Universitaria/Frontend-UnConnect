import { defineConfig } from 'vitest/config'
import { loadEnv } from 'vite'         
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {  
  const env = loadEnv(mode ?? 'development', '../', '')  

  return {
    plugins: [react()],
    define: {                                
      'import.meta.env.VITE_API_URL': JSON.stringify(env.VITE_API_URL),
      'import.meta.env.VITE_AUTH0_DOMAIN': JSON.stringify(env.VITE_AUTH0_DOMAIN),
      'import.meta.env.VITE_AUTH0_CLIENT_ID': JSON.stringify(env.VITE_AUTH0_CLIENT_ID),
      'import.meta.env.VITE_AUTH0_CONNECTION': JSON.stringify(env.VITE_AUTH0_CONNECTION),
      'import.meta.env.VITE_ALLOWED_DOMAIN': JSON.stringify(env.VITE_ALLOWED_DOMAIN),
      'import.meta.env.VITE_GOOGLE_CLIENT_ID_WEB': JSON.stringify(env.VITE_GOOGLE_CLIENT_ID_WEB),
    },
    server: {
      port: 5173,
      strictPort: true,
      fs: {
        allow: ['..'],
      },
    },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: './src/setupTests.ts',
      coverage: {
        provider: 'v8',
        reporter: ['text', 'json-summary'],
        include: ['src/**/*.{js,jsx,ts,tsx}'],
        exclude: [
          'src/**/*.test.{js,jsx,ts,tsx}',
          'src/main.tsx',
        ],
      },
    },
  }
})