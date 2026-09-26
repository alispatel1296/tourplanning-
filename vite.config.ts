import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import { tripflowTravelPlugin } from './server/vitePlugin'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  if (env.SERPAPI_API_KEY && !process.env.SERPAPI_API_KEY) {
    process.env.SERPAPI_API_KEY = env.SERPAPI_API_KEY
  }

  return {
    plugins: [react(), tailwindcss(), tripflowTravelPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor-react': ['react', 'react-dom', 'react-router-dom'],
            'vendor-charts': ['recharts'],
            'vendor-motion': ['framer-motion'],
            'vendor-icons': ['lucide-react'],
            'vendor-maps': ['leaflet'],
            'vendor-dates': ['date-fns'],
          },
        },
      },
    },
  }
})
