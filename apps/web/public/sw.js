self.addEventListener("push", event => {
  const data = event.data?.json?.() ?? { title: "WEGO", body: "У вас новое событие" };
  event.waitUntil(self.registration.showNotification(data.title, { body: data.body, icon: "/favicon.svg", data: { url: data.url ?? "/" } }));
});
self.addEventListener("notificationclick", event => { event.notification.close(); event.waitUntil(clients.openWindow(event.notification.data?.url ?? "/")); });
