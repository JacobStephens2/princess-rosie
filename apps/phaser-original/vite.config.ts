import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  build: {
    outDir: "../../dist",
    emptyOutDir: true,
  },
  plugins: [
    VitePWA({
      registerType: "autoUpdate",
      manifest: {
        name: "Princess Rosie and the Seven Birthday Stars",
        short_name: "Princess Rosie",
        description: "A tiny flying birthday adventure through Fairytale Sicily.",
        theme_color: "#e94f9b",
        background_color: "#fff3f8",
        display: "fullscreen",
        orientation: "landscape",
        start_url: "/",
        scope: "/",
        icons: [
          { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
          { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,png,svg,webp,mp3,ogg,json}"],
        maximumFileSizeToCacheInBytes: 8 * 1024 * 1024,
        navigateFallback: "/index.html",
      },
    }),
  ],
});
