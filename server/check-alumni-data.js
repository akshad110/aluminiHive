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

async function checkData() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB");
    
    const { User, Alumni, Student } = await import("./models/index.ts");
    
    // Get all users with role "alumni"
    const alumniUsers = await User.find({ role: "alumni" }).limit(10);
    console.log(`\n👤 Found ${alumniUsers.length} users with role "alumni"`);
    
    for (const user of alumniUsers) {
      console.log(`\n📋 User: ${user.email} (${user._id})`);
      
      // Check if Alumni profile exists
      const alumniProfile = await Alumni.findOne({ userId: user._id });
      if (alumniProfile) {
        console.log(`   ✅ Alumni profile EXISTS`);
        console.log(`      Alumni ID: ${alumniProfile._id}`);
        console.log(`      Graduation Year: ${alumniProfile.graduationYear}`);
        console.log(`      Degree: ${alumniProfile.degree}`);
        console.log(`      Branch: ${alumniProfile.branch}`);
      } else {
        console.log(`   ❌ Alumni profile MISSING!`);
        console.log(`      User ID: ${user._id}`);
        console.log(`      User email: ${user.email}`);
        console.log(`      User role: ${user.role}`);
        console.log(`      User college: ${user.college}`);
        
        // Check if there's an Alumni with a different userId format
        const allAlumni = await Alumni.find({}).limit(5);
        console.log(`   📊 Sample Alumni records:`);
        for (const a of allAlumni) {
          console.log(`      Alumni ID: ${a._id}, User ID: ${a.userId}, Type: ${typeof a.userId}`);
        }
      }
    }
    
    // Check all Alumni records
    const allAlumni = await Alumni.find({}).limit(10);
    console.log(`\n📚 Found ${allAlumni.length} Alumni records in database`);
    for (const alumni of allAlumni) {
      const user = await User.findById(alumni.userId);
      console.log(`   Alumni ID: ${alumni._id}, User: ${user?.email || 'NOT FOUND'} (${alumni.userId})`);
    }
    
    // Check recent users
    const recentUsers = await User.find({}).sort({ createdAt: -1 }).limit(5);
    console.log(`\n🆕 Recent users (last 5):`);
    for (const user of recentUsers) {
      const hasAlumni = await Alumni.findOne({ userId: user._id });
      const hasStudent = await Student.findOne({ userId: user._id });
      console.log(`   ${user.email} (${user.role}) - Alumni: ${hasAlumni ? '✅' : '❌'}, Student: ${hasStudent ? '✅' : '❌'}`);
    }
    
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await mongoose.disconnect();
  }
}

checkData();

