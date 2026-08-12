self.addEventListener("push", function (event) {
  if (!event.data) return;

  let data = {};
  try {
    data = event.data.json();
  } catch {
    data = { title: "Dieva Vārds šodienai", body: event.data.text() };
  }

  const title = data.title || "Dieva Vārds šodienai";
  const options = {
    body: data.body || "Atver un izlasi.",
    icon: data.icon || "/icons/icon-192.png",
    badge: data.badge || "/icons/badge-96.png",
    data: {
      url: data.url || "/kid",
    },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", function (event) {
  event.notification.close();
  const path =
    (event.notification.data && event.notification.data.url) || "/kid";
  const targetUrl = new URL(path, self.location.origin).href;

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then(
      function (clientList) {
        for (const client of clientList) {
          if ("focus" in client && client.url.startsWith(self.location.origin)) {
            client.navigate(targetUrl);
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow(targetUrl);
        }
      },
    ),
  );
});
