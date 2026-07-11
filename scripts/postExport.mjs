// Run after `expo export --platform web` to make the build installable as a
// PWA (home-screen icon, name, fullscreen, themed status bar).
//
//   npx expo export --platform web && node scripts/postExport.mjs
//
// Idempotent — safe to run after every export.

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const assets = path.join(root, 'assets');

if (!fs.existsSync(dist)) {
  console.error('dist/ not found — run `npx expo export --platform web` first.');
  process.exit(1);
}

// 1. Copy the branded icons into the site root.
const iconMap = {
  'pwa-icon-180.png': 'icon-180.png',
  'pwa-icon-192.png': 'icon-192.png',
  'pwa-icon-512.png': 'icon-512.png',
  'pwa-icon-1024.png': 'icon-1024.png',
};
for (const [src, dest] of Object.entries(iconMap)) {
  fs.copyFileSync(path.join(assets, src), path.join(dist, dest));
}

// 2. Web app manifest (Android / Chrome install).
const manifest = {
  name: 'HoloTCG',
  short_name: 'HoloTCG',
  description: 'Hololive Card Game database, deck builder and collection tracker.',
  start_url: '/',
  scope: '/',
  display: 'standalone',
  orientation: 'portrait',
  background_color: '#edecf3',
  theme_color: '#534b88',
  icons: [
    { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
    { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
    { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
  ],
};
fs.writeFileSync(path.join(dist, 'manifest.webmanifest'), JSON.stringify(manifest, null, 2));

// 3. Inject PWA + iOS home-screen tags into index.html.
const indexPath = path.join(dist, 'index.html');
let html = fs.readFileSync(indexPath, 'utf8');

const tags = `
    <meta name="description" content="Hololive Card Game database, deck builder and collection tracker." />
    <meta name="theme-color" content="#534b88" />
    <link rel="manifest" href="/manifest.webmanifest" />
    <meta name="mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
    <meta name="apple-mobile-web-app-title" content="HoloTCG" />
    <link rel="apple-touch-icon" href="/icon-180.png" />
    <link rel="icon" type="image/png" sizes="192x192" href="/icon-192.png" />
  `;

if (!html.includes('manifest.webmanifest')) {
  html = html.replace('</head>', `${tags}</head>`);
  fs.writeFileSync(indexPath, html);
}

// 4. SPA fallback: some hosts need a 404 that serves index.html for deep links.
fs.copyFileSync(indexPath, path.join(dist, '404.html'));

console.log('postExport: added manifest, icons, and PWA meta tags to dist/.');
