import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "EduKit — Aprender é uma aventura",
    short_name: "EduKit",
    description:
      "Treina ditado, compreensão escrita e matemática com correção inteligente.",
    start_url: "/",
    display: "standalone",
    background_color: "#F8FAFC",
    theme_color: "#84CC16",
    orientation: "portrait",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}
