import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: './',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['fonts.css', 'fonts/*.woff2', 'icons/*.png', 'revierpilot-logo.png'],
      manifest: {
        name: 'Revierpilot',
        short_name: 'Revierpilot',
        description: 'Revierkarte, Jagdplanung, Jagdtagebuch, Jagdzeiten und Büchsenlicht — offline nutzbar.',
        lang: 'de',
        start_url: './',
        scope: './',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#f2eee2',
        theme_color: '#f2eee2',
        icons: [
          { src: './icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: './icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: './icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Alles, was die App zum Starten braucht, liegt danach auf dem Gerät —
        // Schriften und Logo eingeschlossen, sonst fehlen sie ohne Empfang.
        globPatterns: ['**/*.{js,css,html,woff2,png}'],
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
        navigateFallback: 'index.html',
        cleanupOutdatedCaches: true,
      },
    }),
  ],
});
