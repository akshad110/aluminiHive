// Quick test to check if imports work
import { createServer } from "./index.js";
import { disconnectDB } from "./db/connection.js";

console.log("✅ Imports successful!");
console.log("createServer:", typeof createServer);
console.log("disconnectDB:", typeof disconnectDB);

