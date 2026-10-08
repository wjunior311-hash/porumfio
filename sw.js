// Service worker: deixa o app abrir rápido e instalável. Dados da mesa sempre vêm da internet.
const VERSAO = 'porumfio-v7';
const BASE = ['./', 'index.html', 'css/app.css?v=7', 'js/app.js?v=7', 'js/regras.js', 'js/mesa.js', 'js/notas.js', 'js/bestiario.js', 'js/bichinho.js', 'manifest.webmanifest',
  'icons/icon-192.png', 'icons/icon-512.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSAO).then((c) => c.addAll(BASE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== VERSAO).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return; // Supabase e fontes: direto da rede
  // rede primeiro, cache como reserva (assim atualizações aparecem logo)
  e.respondWith(
    fetch(e.request).then((r) => {
      if (r.ok) { const copia = r.clone(); caches.open(VERSAO).then((c) => c.put(e.request, copia)); }
      return r;
    }).catch(() => caches.match(e.request).then((r) => r || caches.match('index.html')))
  );
});
