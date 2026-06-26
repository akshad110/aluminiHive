import "dotenv/config";
import fetch from "node-fetch";

const BASE_URL = process.env.VITE_API_URL || "http://localhost:3000";
const MONGODB_URI = process.env.MONGODB_URI;

console.log("🧪 Testing API Endpoints");
console.log("📡 Base URL:", BASE_URL);
console.log("🔗 MongoDB URI:", MONGODB_URI ? MONGODB_URI.replace(/\/\/[^:]+:[^@]+@/, "//***:***@") : "NOT SET");

async function testEndpoint(name, url, method = "GET", body = null) {
  try {
    const options = {
      method,
      headers: { "Content-Type": "application/json" },
    };
    if (body) {
      options.body = JSON.stringify(body);
    }
    
    const response = await fetch(url, options);
    const data = await response.json();
    
    console.log(`\n✅ ${name}:`);
    console.log(`   Status: ${response.status}`);
    console.log(`   Response:`, JSON.stringify(data, null, 2).substring(0, 500));
    
    return { success: response.ok, status: response.status, data };
  } catch (error) {
    console.log(`\n❌ ${name}:`);
    console.log(`   Error:`, error.message);
    return { success: false, error: error.message };
  }
}

async function runTests() {
  console.log("\n" + "=".repeat(60));
  console.log("Testing Database Health Check");
  console.log("=".repeat(60));
  
  await testEndpoint(
    "Database Health Check",
    `${BASE_URL}/api/health/db`
  );
  
  console.log("\n" + "=".repeat(60));
  console.log("Testing User-related APIs");
  console.log("=".repeat(60));
  
  // Test ping
  await testEndpoint("Ping", `${BASE_URL}/api/ping`);
  
  // If we have a user ID from health check, test user-specific endpoints
  const healthResponse = await fetch(`${BASE_URL}/api/health/db`);
  if (healthResponse.ok) {
    const healthData = await healthResponse.json();
    if (healthData.samples?.user?._id) {
      const userId = healthData.samples.user._id;
      console.log(`\n📋 Testing with user ID: ${userId}`);
      
      await testEndpoint(
        "Get Conversations",
        `${BASE_URL}/api/messages/conversations/${userId}`
      );
      
      if (healthData.samples.user.role === "alumni") {
        await testEndpoint(
          "Get Mentorship Requests for Alumni",
          `${BASE_URL}/api/alumni-dashboard/mentorship-requests/${userId}`
        );
      }
    }
  }
  
  console.log("\n" + "=".repeat(60));
  console.log("✅ API Testing Complete");
  console.log("=".repeat(60));
}

runTests().catch(console.error);

