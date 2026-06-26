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
import { ServiceWorkerCleanup } from "@/components/ServiceWorkerCleanup";

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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-PT">
      <body>
        <ServiceWorkerCleanup />
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
