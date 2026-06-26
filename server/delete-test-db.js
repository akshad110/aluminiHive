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
await mongoose.connect(uri);

// Delete test database
const adminDb = mongoose.connection.client.db('admin');
try {
  const testDb = mongoose.connection.client.db('test');
  const collections = await testDb.listCollections().toArray();
  console.log(`\n🗑️  Found ${collections.length} collections in 'test' database`);
  
  if (collections.length > 0) {
    console.log("   Deleting collections from 'test' database...");
    for (const coll of collections) {
      await testDb.collection(coll.name).drop();
      console.log(`   ✅ Deleted: ${coll.name}`);
    }
  }
  
  // Drop the test database
  await testDb.dropDatabase();
  console.log("✅ 'test' database deleted");
} catch (e) {
  console.log("   'test' database doesn't exist or already deleted");
}

await mongoose.disconnect();
console.log("\n✅ Done");

