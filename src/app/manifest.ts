import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Augt",
    short_name: "Augt",
    description: "Dieva Vārds. Ticība. Dzīve. Katru dienu.",
    start_url: "/kid",
    display: "standalone",
    background_color: "#f7faf8",
    theme_color: "#1a3a32",
    lang: "lv",
    icons: [
      {
        src: "/icons/icon-192.png?v=sprout",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png?v=sprout",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512-maskable.png?v=sprout",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
