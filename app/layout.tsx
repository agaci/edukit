import type { Metadata, Viewport } from "next";
import "@fontsource/nunito/400.css";
import "@fontsource/nunito/600.css";
import "@fontsource/nunito/700.css";
import "@fontsource/nunito/800.css";
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/caveat/600.css";
import "@fontsource/caveat/700.css";
import "./globals.css";
import { AppHeader } from "@/components/layout/AppHeader";
import { ToastProvider } from "@/components/ui/Toast";
import { AuthProvider } from "@/components/auth/AuthProvider";

export const metadata: Metadata = {
  title: "EduKit — Aprender é uma aventura",
  description:
    "Aplicação educacional do 1.º ao 12.º ano: ditado, compreensão escrita e matemática, com correção inteligente.",
  applicationName: "EduKit",
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/icon.svg" }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "EduKit",
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export const viewport: Viewport = {
  themeColor: "#84CC16",
  width: "device-width",
  initialScale: 1,
};

/**
 * O EduKit não usa service worker. Um service worker antigo do mesmo localhost
 * (ex.: pwabuilder-sw.js de outro projeto) continua a intercetar pedidos e a
 * servir HTML/chunks obsoletos mesmo com Cache-Control: no-store, o que quebra
 * a hidratação do Next.js ("Invariant: Missing ActionQueueContext").
 *
 * Isto tem de correr ANTES da hidratação: em React o erro é lançado acima de
 * qualquer componente da app, por isso um useEffect nunca chegaria a executar.
 */
const swCleanup = `(function () {
  try {
    if (!("serviceWorker" in navigator)) return;
    var KEY = "edukit:sw-cleaned";
    navigator.serviceWorker.getRegistrations().then(function (regs) {
      var hadSw = regs.length > 0 || !!navigator.serviceWorker.controller;
      if (!hadSw) return;
      return Promise.all(regs.map(function (r) { return r.unregister(); }))
        .then(function () {
          if (!("caches" in window)) return null;
          return caches.keys().then(function (keys) {
            return Promise.all(keys.map(function (k) { return caches.delete(k); }));
          });
        })
        .then(function () {
          // Um único reload por sessão garante uma página limpa sem ciclos.
          var already = null;
          try { already = sessionStorage.getItem(KEY); } catch (e) {}
          if (already) return;
          try { sessionStorage.setItem(KEY, "1"); } catch (e) {}
          location.reload();
        });
    }).catch(function () {});
  } catch (e) {}
})();`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-PT">
      <head>
        <script dangerouslySetInnerHTML={{ __html: swCleanup }} />
      </head>
      <body>
        <ToastProvider>
          <AuthProvider>
            <AppHeader />
            <main className="mx-auto min-h-[calc(100vh-4rem)] max-w-6xl px-4 py-8 sm:px-6">
              {children}
            </main>
          </AuthProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
