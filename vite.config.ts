import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  base: loadEnv(mode, process.cwd(), '').VITE_PUBLIC_BASE_PATH || (mode === 'production' ? '/newregistrationportal/' : '/'),
  server: { port: 5174, strictPort: true },
  plugins: [react()],
}))
