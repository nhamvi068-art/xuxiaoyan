import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { localUploadPlugin } from './vite-plugin-local-upload.mjs'

export default defineConfig({
  plugins: [react(), localUploadPlugin()],
  server: {
    host: true,
    port: 5173
  }
})
