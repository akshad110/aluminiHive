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
const BASE_URL = process.env.VITE_API_URL || "http://localhost:3000";

async function testUserCreation() {
  try {
    console.log("🧪 Testing User Creation and Database Verification\n");
    
    // Connect to MongoDB using the same logic as server
    let uri = MONGODB_URI || "mongodb://localhost:27017/aluminihive";
    
    // Force database name to be 'aluminihive'
    if (uri.includes('mongodb+srv://') || uri.includes('mongodb://')) {
      const uriParts = uri.split('/');
      const hostPart = uriParts.slice(0, 3).join('/');
      const queryPart = uriParts[uriParts.length - 1].includes('?') 
        ? '?' + uriParts[uriParts.length - 1].split('?')[1] 
        : '';
      uri = `${hostPart}/aluminihive${queryPart}`;
    }
    
    console.log("🔗 Connecting to MongoDB...");
    console.log("   URI (masked):", uri.replace(/\/\/[^:]+:[^@]+@/, "//***:***@"));
    
    await mongoose.connect(uri, { dbName: 'aluminihive' });
    
    const dbName = mongoose.connection.db?.databaseName;
    console.log("✅ Connected to database:", dbName);
    
    if (dbName !== 'aluminihive') {
      console.error(`❌ WRONG DATABASE! Connected to "${dbName}" instead of "aluminihive"`);
      await mongoose.disconnect();
      return;
    }
    
    const { User, Alumni } = await import("./models/index.ts");
    
    // Get counts before
    const usersBefore = await User.countDocuments({});
    const alumniBefore = await Alumni.countDocuments({});
    console.log(`\n📊 Before creation:`);
    console.log(`   Users: ${usersBefore}`);
    console.log(`   Alumni: ${alumniBefore}`);
    
    // Create test user via API
    const testEmail = `test-${Date.now()}@test.com`;
    const signupData = {
      name: "Test User",
      email: testEmail,
      password: "testpass123",
      batch: "2020",
      college: "Test College",
      role: "alumni"
    };
    
    console.log(`\n📝 Creating test user: ${testEmail}`);
    
    try {
      const response = await fetch(`${BASE_URL}/api/auth/simple-signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(signupData)
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        console.error("❌ Signup failed:", result);
        return;
      }
      
      console.log("✅ Signup API response received");
      
      // Wait a moment for database write
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Check which database has the user
      console.log(`\n🔍 Checking databases for user: ${testEmail}`);
      
      // Check in 'aluminihive' database
      const userInAluminihive = await User.findOne({ email: testEmail });
      const alumniInAluminihive = userInAluminihive 
        ? await Alumni.findOne({ userId: userInAluminihive._id })
        : null;
      
      // Check in 'test' database
      const testDb = mongoose.connection.client.db('test');
      const usersTestCollection = testDb.collection('users');
      const alumnisTestCollection = testDb.collection('alumnis');
      const userInTest = await usersTestCollection.findOne({ email: testEmail });
      const alumniInTest = userInTest 
        ? await alumnisTestCollection.findOne({ userId: userInTest._id })
        : null;
      
      console.log(`\n📊 Results:`);
      console.log(`   Database: ${dbName}`);
      console.log(`   User in ${dbName}: ${userInAluminihive ? '✅' : '❌'}`);
      console.log(`   Alumni in ${dbName}: ${alumniInAluminihive ? '✅' : '❌'}`);
      console.log(`   User in 'test': ${userInTest ? '❌ FOUND IN WRONG DB!' : '✅ Not found'}`);
      console.log(`   Alumni in 'test': ${alumniInTest ? '❌ FOUND IN WRONG DB!' : '✅ Not found'}`);
      
      if (userInAluminihive) {
        console.log(`\n✅ SUCCESS: User created in correct database "${dbName}"`);
        console.log(`   User ID: ${userInAluminihive._id}`);
        if (alumniInAluminihive) {
          console.log(`   Alumni ID: ${alumniInAluminihive._id}`);
        } else {
          console.log(`   ⚠️  Alumni profile not found`);
        }
      } else if (userInTest) {
        console.error(`\n❌ ERROR: User was created in WRONG database "test"!`);
        console.error(`   This means the connection is not using the correct database.`);
      } else {
        console.error(`\n❌ ERROR: User not found in any database!`);
      }
      
      // Cleanup
      if (userInAluminihive) {
        await User.deleteOne({ _id: userInAluminihive._id });
        if (alumniInAluminihive) {
          await Alumni.deleteOne({ _id: alumniInAluminihive._id });
        }
        console.log(`\n🧹 Cleaned up test user`);
      }
      
    } catch (apiError) {
      console.error("❌ API call failed:", apiError.message);
      console.log("   Make sure the server is running on", BASE_URL);
    }
    
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await mongoose.disconnect();
    console.log("\n🔌 Disconnected");
  }
}

testUserCreation();

