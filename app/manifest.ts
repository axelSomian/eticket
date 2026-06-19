import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Gala de Retrouvailles",
    short_name: "Gala",
    description: "Gestion et validation des tickets du Gala de Retrouvailles",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#030712",
    theme_color: "#f59e0b",
    icons: [
      {
        src: "/icon.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
