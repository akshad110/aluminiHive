const fs = require('fs');
const path = require('path');

console.log('🚀 Setting up Agora App Builder integration...\n');

// Check if .env file exists
const envPath = path.join(__dirname, '.env');

if (!fs.existsSync(envPath)) {
  console.log('📝 Creating .env file...');
  
  const envContent = `# Agora.io Configuration
# Get your App ID from https://console.agora.io/
VITE_AGORA_APP_ID=your_agora_app_id_here

# Optional: For production, use server-generated tokens
# For testing, you can leave this empty to use null token
VITE_AGORA_TOKEN=

# Agora App Builder URL (get this after deploying your app)
VITE_AGORA_APP_BUILDER_URL=https://your-app-builder-url.agora.io

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/aluminiHive

# Server Configuration
PORT=3001
`;

  fs.writeFileSync(envPath, envContent);
  console.log('✅ .env file created successfully!');
} else {
  console.log('✅ .env file already exists');
}

console.log('\n📋 Next steps:');
console.log('1. Go to https://appbuilder.agora.io/');
console.log('2. Create your "AlumniHive VIDEO CHAT" app');
console.log('3. Deploy the app and get your App Builder URL');
console.log('4. Update VITE_AGORA_APP_BUILDER_URL in your .env file');
console.log('5. Get your Agora App ID from https://console.agora.io/');
console.log('6. Update VITE_AGORA_APP_ID in your .env file');
console.log('7. Restart your development server');

console.log('\n🎯 Benefits of using Agora App Builder:');
console.log('- Pre-built video calling interface');
console.log('- Professional UI/UX');
console.log('- Easy integration with iframe');
console.log('- No need to build custom video controls');
console.log('- Automatic participant management');

console.log('\n✨ Happy coding!');
