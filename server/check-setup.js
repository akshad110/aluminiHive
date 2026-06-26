// Diagnostic script to check server setup
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🔍 Checking server setup...\n');

// Check if tsx is available
try {
  const { execSync } = await import('child_process');
  try {
    execSync('tsx --version', { stdio: 'pipe' });
    console.log('✅ tsx is installed');
  } catch (e) {
    console.log('❌ tsx is NOT installed. Run: npm install');
  }
} catch (e) {
  console.log('⚠️  Could not check tsx version');
}

// Check critical files
const filesToCheck = [
  'server.ts',
  'index.ts',
  'db/connection.ts',
  'package.json'
];

console.log('\n📁 Checking critical files:');
filesToCheck.forEach(file => {
  const path = join(__dirname, file);
  if (existsSync(path)) {
    console.log(`✅ ${file} exists`);
  } else {
    console.log(`❌ ${file} is MISSING`);
  }
});

// Check if node_modules exists
const nodeModulesPath = join(__dirname, 'node_modules');
if (existsSync(nodeModulesPath)) {
  console.log('✅ node_modules exists');
} else {
  console.log('❌ node_modules is MISSING - Run: npm install');
}

console.log('\n✨ Setup check complete!');

