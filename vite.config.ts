import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import { copyFileSync } from "fs";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    {
      name: "copy-staticwebapp-config",
      closeBundle() {
        copyFileSync(
          path.resolve(__dirname, "staticwebapp.config.json"),
          path.resolve(__dirname, "dist", "staticwebapp.config.json")
        );
      },
    },
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5656,
  },
});
