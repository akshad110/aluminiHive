import "dotenv/config";
import { createServer } from "./index";
import { disconnectDB } from "./db/connection";

const PORT = parseInt(process.env.PORT || "3000", 10);

let server: any = null;

async function start() {
  try {
    const app = await createServer();
    
    // Start server - listen on 0.0.0.0 for Render
    server = app.listen(PORT, "0.0.0.0", () => {
      console.log(`🚀 AlumniHive API server running on port ${PORT}`);
      console.log(`🔧 API: http://0.0.0.0:${PORT}/api`);
      console.log(`📡 Ping: http://0.0.0.0:${PORT}/api/ping`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error("❌ Server startup error:", error);
    process.exit(1);
  }
}

// Graceful shutdown handler
async function gracefulShutdown(signal: string) {
  console.log(`🛑 Received ${signal}, shutting down gracefully...`);
  
  if (server) {
    server.close(async () => {
      console.log("✅ HTTP server closed");
      try {
        await disconnectDB();
        console.log("✅ Database disconnected");
        process.exit(0);
      } catch (error) {
        console.error("❌ Error during shutdown:", error);
        process.exit(1);
      }
    });
    
    // Force close after 10 seconds
    setTimeout(() => {
      console.error("⚠️ Forcing shutdown after timeout");
      process.exit(1);
    }, 10000);
  } else {
    await disconnectDB();
    process.exit(0);
  }
}

// Handle shutdown signals
process.on("SIGINT", () => {
  gracefulShutdown("SIGINT").catch((err) => {
    console.error("Error in graceful shutdown:", err);
    process.exit(1);
  });
});

process.on("SIGTERM", () => {
  gracefulShutdown("SIGTERM").catch((err) => {
    console.error("Error in graceful shutdown:", err);
    process.exit(1);
  });
});

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
  console.error("❌ Uncaught Exception:", error);
  gracefulShutdown("uncaughtException").catch((err) => {
    console.error("Error in graceful shutdown:", err);
    process.exit(1);
  });
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
  console.error("❌ Unhandled Rejection at:", promise, "reason:", reason);
  gracefulShutdown("unhandledRejection").catch((err) => {
    console.error("Error in graceful shutdown:", err);
    process.exit(1);
  });
});

// Start the server
start();

