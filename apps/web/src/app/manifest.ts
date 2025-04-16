import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Daiko AI",
    short_name: "Daiko AI",
    description: "Daiko AI",
    start_url: "/proposals",
    display: "standalone",
    background_color: "#1b1b1b",
    theme_color: "#1b1b1b",
    icons: [
      {
        src: "/pwa/apple-icon-180.png",
        sizes: "any",
        type: "image/png",
      },
    ],
  };
}
