import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// Un unico file .env nella radice del progetto.
const rootDir = path.resolve(__dirname, "..");

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, rootDir, "");

  return {
    plugins: [react()],
    envDir: rootDir,
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    server: {
      port: Number(env.VITE_PORT) || 5173,
      proxy: {
        "/api": {
          target: env.VITE_API_PROXY || "http://localhost:4000",
          changeOrigin: true,
        },
      },
    },
  };
});
