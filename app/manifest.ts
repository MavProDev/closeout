import type { MetadataRoute } from "next"

import { APP } from "@/lib/copy"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: APP.name,
    short_name: APP.shortName,
    description: APP.description,
    start_url: "/",
    display: "standalone",
    background_color: "#0e0e0c",
    theme_color: "#ff6b35",
    orientation: "portrait",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  }
}
