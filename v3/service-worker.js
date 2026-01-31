const CACHE_NAME = 'transport-v3';
const urlsToCache = [
    '/prvtfreebus/v3/transport.html',
    '/prvtfreebus/v3/index.html',
    '/prvtfreebus/v3/qr.html',
    '/prvtfreebus/v3/payment.html',
    '/prvtfreebus/v3/settings.html',
    '/prvtfreebus/v3/index.js',
    '/prvtfreebus/v3/icons/icon-192.png',
    '/prvtfreebus/v3/icons/icon-512.png'
];

// Встановлення Service Worker
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Кешування файлів...');
                return cache.addAll(urlsToCache);
            })
            .then(() => self.skipWaiting()) // Активувати новий SW негайно
    );
});

// Активація Service Worker
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Видалення старого кешу:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim()) // Контролювати всі клієнти негайно
    );
});

// Стратегія для fetch запитів - Network First, потім Cache
self.addEventListener('fetch', (event) => {
    const { request } = event;
    
    // Для навігаційних запитів (HTML сторінки)
    if (request.mode === 'navigate') {
        event.respondWith(
            fetch(request)
                .then((response) => {
                    // Клонуємо відповідь для кешування
                    const responseToCache = response.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(request, responseToCache);
                    });
                    return response;
                })
                .catch(() => {
                    // Якщо немає мережі, використовуємо кеш
                    return caches.match(request).then((cachedResponse) => {
                        if (cachedResponse) {
                            return cachedResponse;
                        }
                        // Якщо і в кеші нічого немає, повертаємо fallback
                        return caches.match('/prvtfreebus/v3/index.html');
                    });
                })
        );
        return;
    }
    
    // Для всіх інших запитів - Cache First, потім Network
    event.respondWith(
        caches.match(request)
            .then((cachedResponse) => {
                if (cachedResponse) {
                    // Оновлюємо кеш в фоні
                    fetch(request).then((response) => {
                        if (response && response.status === 200) {
                            caches.open(CACHE_NAME).then((cache) => {
                                cache.put(request, response.clone());
                            });
                        } else if (response) {
                            console.log('Фонове оновлення не вдалося, статус:', response.status, 'для', request.url);
                        }
                    }).catch((error) => {
                        console.log('Помилка фонового оновлення:', error, 'для', request.url);
                    });
                    return cachedResponse;
                }
                
                // Якщо немає в кеші, отримуємо з мережі
                return fetch(request).then((response) => {
                    // Кешуємо відповідь якщо вона успішна
                    if (response && response.status === 200) {
                        const responseToCache = response.clone();
                        caches.open(CACHE_NAME).then((cache) => {
                            cache.put(request, responseToCache);
                        });
                    }
                    return response;
                }).catch((error) => {
                    console.log('Помилка fetch:', error);
                    throw error;
                });
            })
    );
});
