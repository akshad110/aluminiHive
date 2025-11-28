import "dotenv/config";
import mongoose from "mongoose";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, "..");
const dotenv = await import("dotenv");
dotenv.config({ path: join(rootDir, ".env") });

let uri = process.env.MONGODB_URI || "mongodb://localhost:27017/aluminihive";
if (uri.includes('mongodb+srv://') || uri.includes('mongodb://')) {
  const uriParts = uri.split('/');
  const hostPart = uriParts.slice(0, 3).join('/');
  const queryPart = uriParts[uriParts.length - 1].includes('?') 
    ? '?' + uriParts[uriParts.length - 1].split('?')[1] 
    : '';
  uri = `${hostPart}/aluminihive${queryPart}`;
}

console.log("🔗 Connecting...");
// Connect without database name, then use useDb
const baseURI = uri.replace(/\/aluminihive(\?|$)/, '/$1').replace(/\/$/, '');
await mongoose.connect(baseURI);
const aluminihiveConnection = mongoose.connection.useDb('aluminihive', { useCache: false });
const dbName = aluminihiveConnection.db.databaseName;
console.log(`📊 Connected to: ${dbName}`);

// Ensure models use the correct connection
Object.defineProperty(mongoose.connection, 'db', {
  get: () => aluminihiveConnection.db,
  configurable: true
});

const { User, Alumni } = await import("./models/index.ts");
const testEmail = `test-${Date.now()}@test.com`;

console.log(`\n📝 Creating user: ${testEmail}`);
const user = new User({
  email: testEmail,
  password: "test123",
  firstName: "Test",
  lastName: "User",
  role: "alumni",
  college: "Test College"
});
await user.save();
console.log(`✅ User saved: ${user._id}`);

const alumni = new Alumni({
  userId: user._id,
  graduationYear: 2020,
  degree: "Bachelor's",
  branch: "CS",
  industry: "Tech",
  location: { city: "Test", state: "Test", country: "Test" }
});
await alumni.save();
console.log(`✅ Alumni saved: ${alumni._id}`);

// Check which database
const userFound = await User.findOne({ email: testEmail });
const testDb = mongoose.connection.client.db('test');
const userInTest = await testDb.collection('users').findOne({ email: testEmail });

console.log(`\n📊 Results:`);
console.log(`   Current DB: ${dbName}`);
console.log(`   User in ${dbName}: ${userFound ? '✅' : '❌'}`);
console.log(`   User in 'test': ${userInTest ? '❌ WRONG!' : '✅'}`);

// Cleanup
await User.deleteOne({ _id: user._id });
await Alumni.deleteOne({ _id: alumni._id });
console.log(`\n🧹 Cleaned up`);

await mongoose.disconnect();
console.log(`\n✅ Test complete - User went to: ${dbName}`);

