import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import mongoose from "mongoose";

// Load .env from root directory (parent of server directory)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, "..");
dotenv.config({ path: join(rootDir, ".env") });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("❌ MONGODB_URI not found in environment variables");
  console.log("💡 Please set MONGODB_URI in your .env file in the root directory");
  console.log(`   Looking for .env at: ${join(rootDir, ".env")}`);
  process.exit(1);
}

// Mask password in URI for logging
const maskedURI = MONGODB_URI.replace(/\/\/[^:]+:[^@]+@/, "//***:***@");
console.log("🔗 Connecting to MongoDB:", maskedURI);

async function testConnection() {
  try {
    // Import models - they're TypeScript, so tsx will handle them
    const models = await import("./models/index.ts");
    const { User, Message, MentorshipRequest } = models;
    
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log("✅ MongoDB connected successfully");
    console.log("📊 Database:", mongoose.connection.db.databaseName);
    console.log("🌐 Host:", mongoose.connection.host);
    
    // List all collections
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    console.log("\n📚 Collections in database:");
    collections.forEach((coll, index) => {
      console.log(`   ${index + 1}. ${coll.name}`);
    });
    
    // Get counts for each collection
    console.log("\n📊 Collection Statistics:");
    for (const coll of collections) {
      try {
        const count = await db.collection(coll.name).countDocuments({});
        console.log(`   ${coll.name}: ${count} documents`);
      } catch (e) {
        console.log(`   ${coll.name}: Error counting - ${e.message}`);
      }
    }
    
    // Test User model
    console.log("\n👤 Testing User Model:");
    const userCount = await User.countDocuments({});
    console.log(`   Total users: ${userCount}`);
    if (userCount > 0) {
      const sampleUser = await User.findOne({}).select("-password");
      console.log("   Sample user:", {
        _id: sampleUser?._id,
        email: sampleUser?.email,
        firstName: sampleUser?.firstName,
        lastName: sampleUser?.lastName,
        role: sampleUser?.role,
        college: sampleUser?.college
      });
    }
    
    // Test Message model
    console.log("\n💬 Testing Message Model:");
    const messageCount = await Message.countDocuments({});
    console.log(`   Total messages: ${messageCount}`);
    if (messageCount > 0) {
      const sampleMessage = await Message.findOne({})
        .populate("sender", "firstName lastName email")
        .populate("receiver", "firstName lastName email");
      console.log("   Sample message:", {
        _id: sampleMessage?._id,
        sender: sampleMessage?.sender,
        receiver: sampleMessage?.receiver,
        content: sampleMessage?.content?.substring(0, 50),
        createdAt: sampleMessage?.createdAt
      });
    }
    
    // Test MentorshipRequest model
    console.log("\n🤝 Testing MentorshipRequest Model:");
    const requestCount = await MentorshipRequest.countDocuments({});
    console.log(`   Total mentorship requests: ${requestCount}`);
    if (requestCount > 0) {
      const sampleRequest = await MentorshipRequest.findOne({})
        .populate("studentId", "firstName lastName email")
        .populate("alumniId", "firstName lastName email");
      console.log("   Sample request:", {
        _id: sampleRequest?._id,
        student: sampleRequest?.studentId,
        alumni: sampleRequest?.alumniId,
        title: sampleRequest?.title,
        status: sampleRequest?.status,
        createdAt: sampleRequest?.createdAt
      });
    }
    
    // Test a specific user's data
    if (userCount > 0) {
      const testUser = await User.findOne({});
      if (testUser) {
        console.log(`\n🔍 Testing queries for user: ${testUser._id}`);
        
        // Test conversations query
        const userMessages = await Message.countDocuments({
          $or: [
            { sender: testUser._id },
            { receiver: testUser._id }
          ]
        });
        console.log(`   Messages for this user: ${userMessages}`);
        
        // Test mentorship requests for alumni
        if (testUser.role === "alumni") {
          const alumniRequests = await MentorshipRequest.countDocuments({
            alumniId: testUser._id
          });
          console.log(`   Mentorship requests for this alumni: ${alumniRequests}`);
        }
      }
    }
    
    console.log("\n✅ Database connection test completed successfully!");
    
  } catch (error) {
    console.error("❌ Database connection test failed:", error);
    if (error instanceof Error) {
      console.error("   Error message:", error.message);
      if (error.stack) {
        console.error("   Error stack:", error.stack.split("\n").slice(0, 5).join("\n"));
      }
    }
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("\n🔌 Disconnected from MongoDB");
  }
}

testConnection();
