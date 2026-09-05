import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Boundless",
    short_name: "Boundless",
    description:
      "Discover, read, and share original stories, novels, and web serials without limits.",
    start_url: "/",
    display: "standalone",
    background_color: "#0a0a0a",
    theme_color: "#0a0a0a",
    orientation: "portrait",

    icons: [
      {
        src: "/icon/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],

    screenshots: [
      {
        src: "/screenshots/desktop.png",
        sizes: "1365x768",
        type: "image/png",
        form_factor: "wide",
      },
      {
        src: "/screenshots/mobile.png",
        sizes: "390x844",
        type: "image/png",
      },
    ],
  };
}