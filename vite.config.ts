import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Prevent Vite from obscuring Rust errors
  clearScreen: false,
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  server: {
    // Tauri expects a fixed port; fail if it's already in use
    port: 5173,
    strictPort: true,
  },
  // Let Tauri handle env variables
  envPrefix: ['VITE_', 'TAURI_'],
})
