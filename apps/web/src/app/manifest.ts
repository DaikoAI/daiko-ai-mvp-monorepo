import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Daiko AI",
    short_name: "Daiko AI",
    description: "Daiko AI",
    start_url: "/proposals",
    display: "standalone",
    background_color: "#000000",
    theme_color: "#000000",
    icons: [
      {
        src: "/pwa/apple-icon-180.png",
        sizes: "any",
        type: "image/png",
      },
    ],
  };
}
