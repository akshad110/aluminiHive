import { defineConfig, Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "0.0.0.0",
    port: 8081,
    fs: {
      allow: ["./client", "./shared"],
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
}));

function expressPlugin(): Plugin {
  return {
    name: "express-plugin",
    configureServer: async (server) => {
      try {
        // Dynamic import to ensure proper module resolution
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
