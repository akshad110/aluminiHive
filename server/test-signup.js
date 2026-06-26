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

if (!MONGODB_URI) {
  console.error("❌ MONGODB_URI not found");
  process.exit(1);
}

async function testSignup() {
  try {
    // Connect to MongoDB to verify data
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB");
    
    const { User, Alumni, Student } = await import("./models/index.ts");
    
    // Get counts before
    const usersBefore = await User.countDocuments({});
    const alumniBefore = await Alumni.countDocuments({});
    const studentsBefore = await Student.countDocuments({});
    
    console.log("\n📊 Before signup:");
    console.log(`   Users: ${usersBefore}`);
    console.log(`   Alumni: ${alumniBefore}`);
    console.log(`   Students: ${studentsBefore}`);
    
    // Test signup API
    const testEmail = `test-alumni-${Date.now()}@example.com`;
    const signupData = {
      name: "Test Alumni User",
      email: testEmail,
      password: "testpassword123",
      batch: "2020",
      college: "Test University",
      role: "alumni"
    };
    
    console.log("\n🧪 Testing signup API...");
    console.log("   Email:", testEmail);
    
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
    
    console.log("✅ Signup API response:", result);
    
    // Wait a bit for database to update
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Check database after signup
    const usersAfter = await User.countDocuments({});
    const alumniAfter = await Alumni.countDocuments({});
    const studentsAfter = await Student.countDocuments({});
    
    console.log("\n📊 After signup:");
    console.log(`   Users: ${usersAfter} (${usersAfter - usersBefore} new)`);
    console.log(`   Alumni: ${alumniAfter} (${alumniAfter - alumniBefore} new)`);
    console.log(`   Students: ${studentsAfter} (${studentsAfter - studentsBefore} new)`);
    
    // Find the created user
    const createdUser = await User.findOne({ email: testEmail });
    if (createdUser) {
      console.log("\n✅ User created:", {
        _id: createdUser._id,
        email: createdUser.email,
        role: createdUser.role,
        college: createdUser.college
      });
      
      // Check if Alumni profile exists
      const alumniProfile = await Alumni.findOne({ userId: createdUser._id });
      if (alumniProfile) {
        console.log("✅ Alumni profile created:", {
          _id: alumniProfile._id,
          userId: alumniProfile.userId,
          graduationYear: alumniProfile.graduationYear,
          degree: alumniProfile.degree,
          branch: alumniProfile.branch
        });
      } else {
        console.error("❌ Alumni profile NOT found in database!");
        console.error("   User ID:", createdUser._id);
        
        // Check if there are any Alumni records
        const allAlumni = await Alumni.find({}).limit(5);
        console.log("   Sample Alumni records:", allAlumni.map(a => ({
          _id: a._id,
          userId: a.userId
        })));
      }
    } else {
      console.error("❌ User NOT found in database!");
    }
    
    // Cleanup - delete test user
    if (createdUser) {
      await User.deleteOne({ _id: createdUser._id });
      if (alumniProfile) {
        await Alumni.deleteOne({ _id: alumniProfile._id });
      }
      console.log("\n🧹 Cleaned up test user");
    }
    
  } catch (error) {
    console.error("❌ Test failed:", error);
    if (error instanceof Error) {
      console.error("   Error:", error.message);
      console.error("   Stack:", error.stack);
    }
  } finally {
    await mongoose.disconnect();
    console.log("\n🔌 Disconnected from MongoDB");
  }
}

testSignup();

