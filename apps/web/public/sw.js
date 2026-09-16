self.addEventListener("push", event => {
  const data = event.data?.json?.() ?? { title: "WEGO", body: "У вас новое событие" };
  const root = self.registration.scope;
  event.waitUntil(self.registration.showNotification(data.title, { body: data.body, icon: new URL("favicon.svg", root).href, data: { url: data.url ?? root } }));
});
self.addEventListener("notificationclick", event => { event.notification.close(); event.waitUntil(clients.openWindow(event.notification.data?.url ?? self.registration.scope)); });
