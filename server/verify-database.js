import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import mongoose from "mongoose";

// Load .env from root directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, "..");
dotenv.config({ path: join(rootDir, ".env") });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("❌ MONGODB_URI not found");
  process.exit(1);
}

// Mask password for display
const maskedURI = MONGODB_URI.replace(/\/\/[^:]+:[^@]+@/, "//***:***@");
console.log("🔗 MongoDB URI:", maskedURI);

// Extract database name from URI
const dbNameMatch = MONGODB_URI.match(/\/([^?\/]+)(\?|$)/);
const dbNameFromURI = dbNameMatch ? dbNameMatch[1] : "default";

console.log("📊 Database name from URI:", dbNameFromURI);

async function verifyDatabase() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB");
    
    const actualDbName = mongoose.connection.db.databaseName;
    console.log("📊 Actual database name:", actualDbName);
    console.log("🌐 Host:", mongoose.connection.host);
    
    if (actualDbName !== "aluminihive") {
      console.error(`\n❌ WRONG DATABASE! Currently connected to: "${actualDbName}"`);
      console.error(`   Expected: "aluminihive"`);
      console.error(`\n💡 Fix: Update MONGODB_URI to include database name:`);
      console.error(`   Current: ${maskedURI}`);
      console.error(`   Should be: ${MONGODB_URI.split('/').slice(0, -1).join('/')}/aluminihive${MONGODB_URI.includes('?') ? '?' + MONGODB_URI.split('?')[1] : ''}`);
    } else {
      console.log("\n✅ Correct database: aluminihive");
    }
    
    // List collections
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    console.log(`\n📚 Collections in "${actualDbName}" database:`);
    collections.forEach((coll, index) => {
      console.log(`   ${index + 1}. ${coll.name}`);
    });
    
    // Check if alumnis and users collections exist
    const hasAlumnis = collections.some(c => c.name === "alumnis");
    const hasUsers = collections.some(c => c.name === "users");
    
    console.log(`\n📋 Collection Check:`);
    console.log(`   alumnis: ${hasAlumnis ? '✅' : '❌'}`);
    console.log(`   users: ${hasUsers ? '✅' : '❌'}`);
    
    if (hasAlumnis && hasUsers) {
      const { User, Alumni } = await import("./models/index.ts");
      
      const userCount = await User.countDocuments({});
      const alumniCount = await Alumni.countDocuments({});
      
      console.log(`\n📊 Data Count:`);
      console.log(`   Users: ${userCount}`);
      console.log(`   Alumni: ${alumniCount}`);
      
      // Check recent alumni users
      const recentAlumniUsers = await User.find({ role: "alumni" }).sort({ createdAt: -1 }).limit(5);
      console.log(`\n👤 Recent Alumni Users (last 5):`);
      for (const user of recentAlumniUsers) {
        const alumni = await Alumni.findOne({ userId: user._id });
        console.log(`   ${user.email} - Profile: ${alumni ? '✅' : '❌'} - Created: ${user.createdAt}`);
      }
    }
    
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await mongoose.disconnect();
  }
}

verifyDatabase();

