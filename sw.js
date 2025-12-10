/**
 * SERVICE WORKER - PWA
 * ========================================
 * Funcionalidades offline e cache de recursos
 */

const CACHE_NAME = 'box-motors-v1';
const URLS_TO_CACHE = [
  '/',
  '/index.html',
  '/styles.css',
  '/script.js',
  '/manifest.json',
  '/logosvg.png'
];

// ============================================
// INSTALAÇÃO DO SERVICE WORKER
// ============================================
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('📦 Cache criado com sucesso');
        return cache.addAll(URLS_TO_CACHE);
      })
      .catch((error) => {
        console.error('❌ Erro ao criar cache:', error);
      })
  );
  
  // Força a ativação imediata
  self.skipWaiting();
});

// ============================================
// ATIVAÇÃO DO SERVICE WORKER
// ============================================
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ Removendo cache antigo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  
  // Reclama o cliente imediatamente
  self.clients.claim();
});

// ============================================
// ESTRATÉGIA DE FETCH
// ============================================
self.addEventListener('fetch', (event) => {
  // Ignora requisições de chrome-extension
  if (event.request.url.startsWith('chrome-extension://')) {
    return;
  }

  // Estratégia: Cache First, Network Fallback
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Se encontrou no cache, retorna
        if (response) {
          // Atualiza o cache em background
          fetch(event.request)
            .then((networkResponse) => {
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, networkResponse.clone());
              });
            })
            .catch(() => {
              // Falhou a atualização, usa o cache existente
            });
          
          return response;
        }
        
        // Se não está no cache, tenta a rede
        return fetch(event.request)
          .then((response) => {
            // Caches o novo recurso
            if (response && response.status === 200) {
              const responseClone = response.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, responseClone);
              });
            }
            return response;
          })
          .catch(() => {
            // Se falhou a rede e não está em cache
            console.warn('⚠️ Offline - Usando cache para:', event.request.url);
            
            // Retorna página de offline se disponível
            if (event.request.destination === 'document') {
              return caches.match('/index.html');
            }
          });
      })
  );
});

// ============================================
// NOTIFICAÇÕES DE PUSH (Futuro)
// ============================================
self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? {};
  const title = data.title || 'Box Motors';
  const options = {
    body: data.body || 'Nova notificação',
    icon: '/manifest.json',
    badge: '/logosvg.png',
    data: data
  };
  
  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// ============================================
// SINCRONIZAÇÃO EM BACKGROUND (Futuro)
// ============================================
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-data') {
    event.waitUntil(
      // Sincroniza dados quando voltar online
      fetch('/api/sync', {
        method: 'POST',
        body: JSON.stringify({
          timestamp: new Date().toISOString()
        })
      }).catch(() => {
        console.log('📡 Sincronização agendada para quando voltar online');
      })
    );
  }
});

console.log('✅ Service Worker ativo e pronto!');
