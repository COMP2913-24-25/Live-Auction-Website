import { defineConfig } from 'vite'
import dotenv from 'dotenv';
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Load the root .env file
dotenv.config({ path: '../.env' });

export default defineConfig({
  define: {
    'process.env': process.env
  },
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false
      }
    }
  }
});