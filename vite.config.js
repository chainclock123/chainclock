import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/icon-192.svg', 'icons/icon-512.svg'],
      manifest: {
        name: 'ChainClock',
        short_name: 'ChainClock',
        description: 'Live Bitcoin block data on a seven-segment display',
        start_url: '/',
        display: 'fullscreen',
        orientation: 'any',
        background_color: '#000000',
        theme_color: '#000000',
        icons: [
          {
            src: 'icons/icon-192.svg',
            sizes: '192x192',
            type: 'image/svg+xml',
          },
          {
            src: 'icons/icon-512.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
          },
        ],
      },
      workbox: {
        // Cache API responses with network-first strategy
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/mempool\.space\/api\//,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'mempool-api',
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 300, // 5 minutes
              },
            },
          },
        ],
      },
    }),
  ],
});
