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

const baseURI = uri.replace(/\/aluminihive(\?|$)/, '/$1').replace(/\/$/, '');
await mongoose.connect(baseURI);

// Check test database
const testDb = mongoose.connection.client.db('test');
const testCollections = await testDb.listCollections().toArray();
console.log(`\n📊 Test database:`);
console.log(`   Collections: ${testCollections.length}`);
if (testCollections.length > 0) {
  console.log(`   ❌ Test database still has ${testCollections.length} collections!`);
  for (const coll of testCollections) {
    const count = await testDb.collection(coll.name).countDocuments({});
    console.log(`      ${coll.name}: ${count} documents`);
  }
} else {
  console.log(`   ✅ Test database is empty (good!)`);
}

// Check aluminihive database
const aluminihiveDb = mongoose.connection.client.db('aluminihive');
const aluminihiveCollections = await aluminihiveDb.listCollections().toArray();
console.log(`\n📊 Aluminihive database:`);
console.log(`   Collections: ${aluminihiveCollections.length}`);
const usersCount = await aluminihiveDb.collection('users').countDocuments({});
const alumniCount = await aluminihiveDb.collection('alumnis').countDocuments({});
console.log(`   Users: ${usersCount}`);
console.log(`   Alumni: ${alumniCount}`);

// Create test user
console.log(`\n📝 Creating test user...`);
const { User, Alumni } = await import("./models/index.ts");
const testEmail = `final-test-${Date.now()}@test.com`;

// Use useDb to ensure correct database
const aluminihiveConnection = mongoose.connection.useDb('aluminihive', { useCache: false });
const UserModel = aluminihiveConnection.model('User', User.schema);
const AlumniModel = aluminihiveConnection.model('Alumni', Alumni.schema);

const user = new UserModel({
  email: testEmail,
  password: "test123",
  firstName: "Final",
  lastName: "Test",
  role: "alumni",
  college: "Test College"
});
await user.save();
console.log(`✅ User saved: ${user._id}`);

const alumni = new AlumniModel({
  userId: user._id,
  graduationYear: 2020,
  degree: "Bachelor's",
  branch: "CS",
  industry: "Tech",
  location: { city: "Test", state: "Test", country: "Test" }
});
await alumni.save();
console.log(`✅ Alumni saved: ${alumni._id}`);

// Verify - check actual document IDs
const userInAluminihive = await aluminihiveDb.collection('users').findOne({ email: testEmail });
const testUsersCollection = testDb.collection('users');
const testUsersCount = await testUsersCollection.countDocuments({});
const userInTest = testUsersCount > 0 ? await testUsersCollection.findOne({ email: testEmail }) : null;

console.log(`\n📊 Verification:`);
console.log(`   Test DB users count: ${testUsersCount}`);
console.log(`   User in aluminihive: ${userInAluminihive ? `✅ (ID: ${userInAluminihive._id})` : '❌'}`);
console.log(`   User in test: ${userInTest ? `❌ WRONG! (ID: ${userInTest._id})` : '✅ Not found (correct!)'}`);

if (userInAluminihive && userInTest) {
  console.log(`\n⚠️  WARNING: User found in BOTH databases!`);
  console.log(`   This means data is being written to both.`);
} else if (userInAluminihive && !userInTest) {
  console.log(`\n✅ SUCCESS: User only in aluminihive database!`);
}

// Cleanup
await UserModel.deleteOne({ _id: user._id });
await AlumniModel.deleteOne({ _id: alumni._id });

await mongoose.disconnect();
console.log(`\n✅ Test complete`);

