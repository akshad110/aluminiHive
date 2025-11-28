import mongoose from "mongoose";
// DON'T import models here - we'll import them AFTER switching to aluminihive database
// This ensures all models are created on the correct database connection

// Ensure database name is always 'aluminihive'
let MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/aluminihive";

// Force database name to be 'aluminihive' - replace any existing database name
if (MONGODB_URI.includes('mongodb+srv://') || MONGODB_URI.includes('mongodb://')) {
  // Extract the base URI (everything before the database name)
  const uriParts = MONGODB_URI.split('/');
  const hostPart = uriParts.slice(0, 3).join('/'); // mongodb+srv://user:pass@host or mongodb://host
  const queryPart = uriParts[uriParts.length - 1].includes('?') 
    ? '?' + uriParts[uriParts.length - 1].split('?')[1] 
    : '';
  
  // Reconstruct URI with 'aluminihive' as database name
  MONGODB_URI = `${hostPart}/aluminihive${queryPart}`;
  
  console.log("🔧 Forced database name to 'aluminihive'");
}

export async function connectDB() {
  try {
    // Check if already connected
    if (mongoose.connection.readyState === 1) {
      const currentDb = mongoose.connection.db?.databaseName;
      if (currentDb === 'aluminihive') {
        console.log("✅ MongoDB already connected to aluminihive");
        console.log("📊 Database:", currentDb);
        console.log("🌐 Host:", mongoose.connection.host);
        return;
      } else {
        console.log(`⚠️  Already connected to wrong database "${currentDb}", reconnecting...`);
        await mongoose.disconnect();
      }
    }
    
    // Log connection attempt (mask password)
    const maskedURI = MONGODB_URI.replace(/\/\/[^:]+:[^@]+@/, "//***:***@");
    console.log("🔗 Connecting to MongoDB:", maskedURI);
    
    // Disconnect any existing connection first
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
    
    const dbName = mongoose.connection.db?.databaseName;
    console.log("✅ MongoDB connected successfully");
    console.log("📊 Database:", dbName);
    console.log("🌐 Host:", mongoose.connection.host);
    
    // CRITICAL: Verify we're using the correct database
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
      }
      console.log("✅ Reconnected to 'aluminihive' database");
    }
    
    // CRITICAL: Clear any existing models that might be bound to wrong connection
    // Then import models AFTER connecting to ensure they use the correct database
    console.log("📦 Clearing existing models and reloading on aluminihive connection...");
    
    // Delete all existing models from mongoose.models to force recreation
    // This ensures models are recreated on the correct connection
    const modelNames = Object.keys(mongoose.models);
    modelNames.forEach(modelName => {
      delete mongoose.models[modelName];
    });
    console.log(`   Cleared ${modelNames.length} existing models`);
    
    // Now import models - they will be created on the current connection (aluminihive)
    await import("../models");
    
    console.log("✅ Models loaded and bound to aluminihive database");
    
    // Verify by checking collections
    const currentDb = mongoose.connection.db;
    if (currentDb) {
      const collections = await currentDb.listCollections().toArray();
      console.log(`📚 Found ${collections.length} collections in database "${currentDb.databaseName}"`);
      
      // Double-check: query the database directly
      const testCollection = currentDb.collection('users');
      const testCount = await testCollection.countDocuments({});
      console.log(`✅ Verified: Found ${testCount} users in "${currentDb.databaseName}" database`);
    }
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
    await mongoose.disconnect();
    console.log("✅ MongoDB disconnected successfully");
  } catch (error) {
    console.error("❌ MongoDB disconnection error:", error);
  }
}

// Handle connection events
mongoose.connection.on("error", (error) => {
  console.error("MongoDB connection error:", error);
});

mongoose.connection.on("disconnected", () => {
  console.log("MongoDB disconnected");
});
