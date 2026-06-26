import mongoose from "mongoose";
// DON'T import models here - we'll import them AFTER switching to aluminihive database
// This ensures all models are created on the correct database connection

// Ensure database name is always 'aluminihive'
let MONGODB_URI = process.env.MONGODB_URI;

// CRITICAL: MONGODB_URI must be set in production
if (!MONGODB_URI) {
  if (process.env.NODE_ENV === 'production') {
    console.error("❌ CRITICAL ERROR: MONGODB_URI environment variable is not set!");
    console.error("   Please set MONGODB_URI in your Render dashboard environment variables.");
    console.error("   Format: mongodb+srv://username:password@cluster.mongodb.net/aluminihive");
    process.exit(1);
  }
  // Only use localhost in development
  MONGODB_URI = "mongodb://localhost:27017/aluminihive";
  console.warn("⚠️  Using default localhost MongoDB (development only)");
}

// Force database name to be 'aluminihive' - replace any existing database name
if (MONGODB_URI.includes('mongodb+srv://') || MONGODB_URI.includes('mongodb://')) {
  // Extract the base URI (everything before the database name)
  const uriParts = MONGODB_URI.split('/');
  const hostPart = uriParts.slice(0, 3).join('/'); // mongodb+srv://user:pass@host or mongodb://host
  const queryPart = uriParts[uriParts.length - 1].includes('?') 
    ? '?' + uriParts[uriParts.length - 1].split('?')[1] 
    : '';
  
  // Reconstruct URI with 'aluminihive' as database name
  MONGODB_URI = `${hostPart}/aluminihive${queryPart}`;}

export async function connectDB() {
  try {
    // Check if already connected
    if (mongoose.connection.readyState === 1) {
      const currentDb = mongoose.connection.db?.databaseName;
      if (currentDb === 'aluminihive') {
        if (Object.keys(mongoose.models).length === 0) {
          await import("../models");
        }        return;
      } else {        await mongoose.disconnect();
      }
    }
    
    // Log connection attempt (mask password)
    const maskedURI = MONGODB_URI.replace(/\/\/[^:]+:[^@]+@/, "//***:***@");    // Disconnect any existing connection first
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    
    // CRITICAL: Ensure URI has /aluminihive before connecting
    const finalURI = MONGODB_URI.includes('/aluminihive') 
      ? MONGODB_URI 
      : MONGODB_URI.replace(/\/([^\/\?]*)(\?|$)/, '/aluminihive$2');
    
    // CRITICAL: Connect WITH database name in URI to prevent defaulting to 'test'
    // This ensures the default connection uses aluminihive from the start
    // IMPORTANT: Don't use dbName option if URI already has database name
    const connectionOptions: any = {};
    if (!finalURI.includes('/aluminihive')) {
      connectionOptions.dbName = 'aluminihive';
    }
    
    await mongoose.connect(finalURI, connectionOptions);
    
    const dbName = mongoose.connection.db?.databaseName;    // CRITICAL: Verify we're using the correct database
    if (dbName !== 'aluminihive') {
      console.error(`❌ ERROR: Connected to wrong database "${dbName}" instead of "aluminihive"`);
      console.error("   Disconnecting and reconnecting with correct database...");
      await mongoose.disconnect();
      
      // Force reconnect with database name in URI
      await mongoose.connect(finalURI, { dbName: 'aluminihive' });
      const verifiedDbName = mongoose.connection.db?.databaseName;
      
      if (verifiedDbName !== 'aluminihive') {
        console.error(`❌ CRITICAL: Still connected to "${verifiedDbName}"`);
        process.exit(1);
      }    }
    
    // Ensure models are registered on the active connection (do not clear existing
    // models — route modules cache model references at import time)
    if (Object.keys(mongoose.models).length === 0) {
      await import("../models");    } else {    }
    
    // Verify by checking collections
    const currentDb = mongoose.connection.db;
    if (currentDb) {
      const collections = await currentDb.listCollections().toArray();      // Double-check: query the database directly
      const testCollection = currentDb.collection('users');
      const testCount = await testCollection.countDocuments({});    }
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    if (error instanceof Error) {
      console.error("   Error message:", error.message);
      if (error.message.includes("authentication failed")) {
        console.error("   💡 Check your MongoDB username and password in MONGODB_URI");
      } else if (error.message.includes("ENOTFOUND") || error.message.includes("ECONNREFUSED")) {
        console.error("   💡 Check your MongoDB host/URL in MONGODB_URI");
      }
    }
    process.exit(1);
  }
}

export async function disconnectDB() {
  try {
    await mongoose.disconnect();  } catch (error) {
    console.error("❌ MongoDB disconnection error:", error);
  }
}

// Handle connection events
mongoose.connection.on("error", (error) => {
  console.error("MongoDB connection error:", error);
});

mongoose.connection.on("disconnected", () => {});
