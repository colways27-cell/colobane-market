import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'Colobane Market',
        short_name: 'Colobane',
        description: 'La marketplace la plus moderne du Sénégal',
        theme_color: '#8a1c1c',
        background_color: '#F8FAFC',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ],
        shortcuts: [
          {
            name: "Vendre un article",
            short_name: "Vendre",
            description: "Publier une nouvelle annonce",
            url: "/publish",
            icons: [{ src: "/pwa-192x192.png", sizes: "192x192" }]
          }
        ]
      },
      workbox: {
        cacheId: 'colobane-market-v105',
        skipWaiting: true,
        clientsClaim: true,
        cleanupOutdatedCaches: true,
        navigateFallbackDenylist: [/^\/api/],
        importScripts: ['/sw-push.js'],
        maximumFileSizeToCacheInBytes: 20 * 1024 * 1024,
        globPatterns: ['**/*.{js,css,png,svg,webp,ico}'],
        runtimeCaching: [
          {
            urlPattern: ({ request }) => request.mode === 'navigate',
            handler: 'NetworkFirst',
            options: {
              cacheName: 'html-navigate-cache',
              networkTimeoutSeconds: 3
            }
          },
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] }
            }
          },
          {
            urlPattern: /^https:\/\/images\.unsplash\.com\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'unsplash-images-cache' }
          },
          {
            // Cache des images Supabase Storage
            urlPattern: /^https:\/\/.*\.supabase\.co\/storage\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'supabase-images-cache',
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 7 }
            }
          }
        ]
      }
    })
  ],

  build: {
    // Augmente légèrement le seuil d'avertissement (nos chunks seront sous 600kB)
    chunkSizeWarningLimit: 600,

    rollupOptions: {
      output: {
        // ─── Découpage manuel des vendors ──────────────────────────────
        manualChunks: (id) => {
          // React core — toujours chargé
          if (id.includes('node_modules/react/') ||
              id.includes('node_modules/react-dom/') ||
              id.includes('node_modules/scheduler/')) {
            return 'vendor-react';
          }

          // React Router — toujours chargé
          if (id.includes('node_modules/react-router') ||
              id.includes('node_modules/@remix-run/')) {
            return 'vendor-router';
          }

          // Supabase — chargé dès l'auth
          if (id.includes('node_modules/@supabase/')) {
            return 'vendor-supabase';
          }

          // Lucide icons — séparé car assez lourd
          if (id.includes('node_modules/lucide-react/')) {
            return 'vendor-icons';
          }

          // Utilitaires divers (date-fns, react-hot-toast, etc.)
          if (id.includes('node_modules/')) {
            return 'vendor-utils';
          }
        }
      }
    }
  }
})
