import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const distPath = path.join(__dirname, '../dist/spa');
const indexPath = path.join(distPath, 'index.html');
const targetPath = path.join(distPath, '404.html');

try {
  const indexContent = fs.readFileSync(indexPath, 'utf8');
  fs.writeFileSync(targetPath, indexContent);
  console.log('✅ Successfully copied index.html to 404.html');
} catch (error) {
  console.error('❌ Error copying 404.html:', error);
  process.exit(1);
}

