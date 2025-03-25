import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Daiko AI",
    short_name: "Daiko AI",
    description: "Daiko AI",
    start_url: "/",
    display: "standalone",
    background_color: "#000000",
    theme_color: "#000000",
    icons: [
      {
        src: "/icon.jpg",
        sizes: "any",
        type: "image/jpg",
      },
    ],
  };
}
