import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('pdfmake') || id.includes('jspdf')) {
              return 'vendor-pdf';
            }
            if (id.includes('vue') || id.includes('vue-router')) {
              return 'vendor-vue';
            }
            if (id.includes('@iconify')) {
              return 'vendor-icons';
            }
            return 'vendor';
          }
        }
      }
    }
  }
})
