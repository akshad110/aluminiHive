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

async function findOrphaned() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB");
    
    const { User, Alumni, Student } = await import("./models/index.ts");
    
    // Find all users
    const allUsers = await User.find({});
    console.log(`\n📊 Total users: ${allUsers.length}`);
    
    // Find users without profiles
    const orphanedAlumni = [];
    const orphanedStudents = [];
    
    for (const user of allUsers) {
      if (user.role === "alumni") {
        const alumni = await Alumni.findOne({ userId: user._id });
        if (!alumni) {
          orphanedAlumni.push(user);
        }
      } else if (user.role === "student") {
        const student = await Student.findOne({ userId: user._id });
        if (!student) {
          orphanedStudents.push(user);
        }
      }
    }
    
    if (orphanedAlumni.length > 0) {
      console.log(`\n❌ Found ${orphanedAlumni.length} alumni users WITHOUT profiles:`);
      for (const user of orphanedAlumni) {
        console.log(`   - ${user.email} (${user._id}) - Created: ${user.createdAt}`);
      }
    } else {
      console.log(`\n✅ All alumni users have profiles`);
    }
    
    if (orphanedStudents.length > 0) {
      console.log(`\n❌ Found ${orphanedStudents.length} student users WITHOUT profiles:`);
      for (const user of orphanedStudents) {
        console.log(`   - ${user.email} (${user._id}) - Created: ${user.createdAt}`);
      }
    } else {
      console.log(`\n✅ All student users have profiles`);
    }
    
    // Show very recent users (last hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentUsers = await User.find({ createdAt: { $gte: oneHourAgo } }).sort({ createdAt: -1 });
    console.log(`\n🆕 Users created in last hour: ${recentUsers.length}`);
    for (const user of recentUsers) {
      if (user.role === "alumni") {
        const alumni = await Alumni.findOne({ userId: user._id });
        console.log(`   ${user.email} (alumni) - Profile: ${alumni ? '✅' : '❌'} - Created: ${user.createdAt}`);
      } else if (user.role === "student") {
        const student = await Student.findOne({ userId: user._id });
        console.log(`   ${user.email} (student) - Profile: ${student ? '✅' : '❌'} - Created: ${user.createdAt}`);
      }
    }
    
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await mongoose.disconnect();
  }
}

findOrphaned();

