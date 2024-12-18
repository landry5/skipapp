import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from "vite-plugin-pwa";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'robots.txt', 'apple-touch-icon.png'],
      manifest: {
        name: 'SKIPP APP',
        short_name: 'App',
        description: 'Household goods for free collection!',
        theme_color: '#ffffff',
        icons: [
          {
            src: '/icons/192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: '/icons/512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        //globPatterns: ['*/.{js,css,html,png,svg,ico,txt}'],
        runtimeCaching: [
          {
            urlPattern: ({ url }) => {
              return url.pathname.startsWith("/");
            },
            handler: "CacheFirst",
            options: {
              cacheName: 'record-cache',
              cacheableResponse: { 
                statuses: [0, 200]
              }
            }
          }
        ]
      }
    })
  ]
});