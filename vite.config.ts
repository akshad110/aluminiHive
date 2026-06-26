import "dotenv/config";
import { defineConfig, loadEnv, Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

import fs from "fs";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

function applyEnv(mode: string) {
  const envPath = path.resolve(projectRoot, ".env");
  if (!fs.existsSync(envPath)) {
    console.warn("⚠️  .env file not found at:", envPath);
  } else {
    const result = dotenv.config({ path: envPath, override: true });
    const loadedCount = result.parsed ? Object.keys(result.parsed).length : 0;
    console.log(`📄 Loaded .env (${loadedCount} variables) from`, envPath);
  }

  const env = loadEnv(mode, projectRoot, "");
  for (const [key, value] of Object.entries(env)) {
    process.env[key] = value;
  }
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  applyEnv(mode);

  return {
  server: {
    host: "0.0.0.0",
    port: 8081,
    fs: {
      allow: [".", "./client", "./shared"],
      deny: [".env", ".env.*", "*.{crt,pem}", "**/.git/**", "server/**"],
    },
  },
  build: {
    outDir: "dist/spa",
    // Copy public folder to dist
    copyPublicDir: true,
  },
  publicDir: "public",
  plugins: [react(), expressPlugin()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./client"),
      "@shared": path.resolve(__dirname, "./shared"),
    },
  },
  };
});

function expressPlugin(): Plugin {
  return {
    name: "express-plugin",
    configureServer: async (server) => {
      try {
        applyEnv(server.config.mode);
        const { createServer: createExpressServer } = await import("./server/index");
        const app = await createExpressServer();

        // Add Express app as middleware to Vite dev server
        server.middlewares.use(app);
      } catch (error) {
        console.error("Failed to load Express server:", error);
        throw error;
      }
    },
  };
}
