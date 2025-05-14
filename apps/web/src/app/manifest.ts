import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Daiko AI",
    short_name: "Daiko AI",
    description: "Daiko AI",
    start_url: "/proposals",
    display: "standalone",
    orientation: "any",
    background_color: "#080808",
    theme_color: "#080808",
    lang: "en",
    icons: [
      {
        src: "/pwa/apple-icon-180.png",
        sizes: "any",
        type: "image/png",
      },
    ],
  };
}
