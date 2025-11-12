// Simple service worker to prevent 404 errors
// This service worker does nothing - just to stop browser from looking for it

self.addEventListener('install', (event) => {
    // Skip waiting and activate immediately
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    // Take control of all pages immediately
    event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
    // Let all requests pass through normally
    event.respondWith(fetch(event.request));
});