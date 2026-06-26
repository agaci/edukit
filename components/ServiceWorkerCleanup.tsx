"use client";

import { useEffect } from "react";

/**
 * O EduKit não usa service worker. Este componente desregista qualquer service
 * worker antigo (ex.: pwabuilder-sw.js de um projeto anterior no mesmo
 * localhost) e limpa caches, evitando que HTML obsoleto seja servido e quebre a
 * hidratação do Next.js ("Missing ActionQueueContext").
 */
export function ServiceWorkerCleanup() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    let didUnregister = false;

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .getRegistrations()
        .then((registrations) => {
          registrations.forEach((reg) => {
            reg.unregister();
            didUnregister = true;
          });
        })
        .catch(() => undefined);
    }

    if ("caches" in window) {
      caches
        .keys()
        .then((keys) => Promise.all(keys.map((k) => caches.delete(k))))
        .then(() => {
          // Se removemos um SW que estava a interceptar pedidos, um único
          // reload garante uma página limpa.
          if (didUnregister) window.location.reload();
        })
        .catch(() => undefined);
    }
  }, []);

  return null;
}
