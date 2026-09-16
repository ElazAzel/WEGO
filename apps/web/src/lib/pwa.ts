export async function registerWegoServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!("serviceWorker" in navigator) || !window.isSecureContext) return null;
  const basePath = import.meta.env.BASE_URL;
  try { return await navigator.serviceWorker.register(`${basePath}sw.js`, { scope: basePath }); } catch { return null; }
}
