import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'ChainClock',
        short_name: 'ChainClock',
        description: 'Open source Bitcoin block viewer with NOSTR integration',
        theme_color: '#000000',
        background_color: '#ffffff',
        display: 'standalone'
      }
    })
  ]
})
