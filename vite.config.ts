import { defineConfig } from "vite";
import { fileURLToPath } from "node:url";

// https://vite.dev/config/
export default defineConfig({
  server: {
    port: 3000,
    open: true,
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
