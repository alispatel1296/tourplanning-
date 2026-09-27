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
  if (env.OPENROUTER_API_KEY && !process.env.OPENROUTER_API_KEY) {
    process.env.OPENROUTER_API_KEY = env.OPENROUTER_API_KEY
  }
  if (env.OPENROUTER_MODEL && !process.env.OPENROUTER_MODEL) {
    process.env.OPENROUTER_MODEL = env.OPENROUTER_MODEL
  }
  if (env.NUGEN_API_KEY && !process.env.NUGEN_API_KEY) {
    process.env.NUGEN_API_KEY = env.NUGEN_API_KEY
  }
  if (env.NUGEN_BASE_MODEL && !process.env.NUGEN_BASE_MODEL) {
    process.env.NUGEN_BASE_MODEL = env.NUGEN_BASE_MODEL
  }
  if (env.NUGEN_CHAT_MODEL && !process.env.NUGEN_CHAT_MODEL) {
    process.env.NUGEN_CHAT_MODEL = env.NUGEN_CHAT_MODEL
  }
  if (env.NUGEN_ALIGNED_MODEL && !process.env.NUGEN_ALIGNED_MODEL) {
    process.env.NUGEN_ALIGNED_MODEL = env.NUGEN_ALIGNED_MODEL
  }
  if (env.AVIATIONSTACK_API_KEY && !process.env.AVIATIONSTACK_API_KEY) {
    process.env.AVIATIONSTACK_API_KEY = env.AVIATIONSTACK_API_KEY
  }
  if (env.RAILRADAR_API_KEY && !process.env.RAILRADAR_API_KEY) {
    process.env.RAILRADAR_API_KEY = env.RAILRADAR_API_KEY
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
