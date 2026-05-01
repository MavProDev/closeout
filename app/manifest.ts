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
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/favicon.ico",
        sizes: "32x32",
        type: "image/x-icon",
      },
    ],
  }
}
