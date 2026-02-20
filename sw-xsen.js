/**
 * XSEN Service Worker — sw-xsen.js
 * Place this file at the ROOT of your domain: xsen.fun/sw-xsen.js
 * Must be at root to have full-domain scope
 */

self.addEventListener('push', function(event) {
  if (!event.data) return;

  const data = event.data.json();

  const options = {
    body: data.body,
    icon: '/images/xsen-icon-192.png',   // add your XSEN icon
    badge: '/images/xsen-badge-72.png',  // small monochrome badge icon
    data: {
      url: data.nil_url || 'https://xsen.fun'
    },
    actions: [
      { action: 'support', title: 'Support Now' },
      { action: 'dismiss', title: 'Dismiss' }
    ],
    vibrate: [200, 100, 200],
    tag: 'xsen-nil',          // replaces previous notification instead of stacking
    renotify: true
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();

  if (event.action === 'dismiss') return;

  // Open/focus the NIL group page on click
  const url = event.notification.data.url;
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      // If XSEN already open, focus it
      for (const client of clientList) {
        if (client.url.includes('xsen.fun') && 'focus' in client) {
          return client.focus();
        }
      }
      // Otherwise open new tab to NIL group page
      return clients.openWindow(url);
    })
  );
});
