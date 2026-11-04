import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const deploymentBase = process.env.VERCEL
    ? '/'
    : mode === 'production'
      ? '/newregistrationportal/'
      : '/'

  return {
    base: env.VITE_PUBLIC_BASE_PATH || deploymentBase,
    server: { port: 5174, strictPort: true },
    plugins: [react()],
  }
})
