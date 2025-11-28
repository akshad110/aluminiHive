import "dotenv/config";
import { createServer } from "./index.js";

const PORT = process.env.PORT || 3000;

async function start() {
  try {
    const app = await createServer();
    
    // Start server - listen on 0.0.0.0 for Render
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`🚀 AlumniHive API server running on port ${PORT}`);
      console.log(`🔧 API: http://0.0.0.0:${PORT}/api`);
      console.log(`📡 Ping: http://0.0.0.0:${PORT}/api/ping`);
    });
  } catch (error) {
    console.error("❌ Server startup error:", error);
    process.exit(1);
  }
}

start();

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("🛑 Received SIGINT, shutting down gracefully");
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("🛑 Received SIGTERM, shutting down gracefully");
  process.exit(0);
});

