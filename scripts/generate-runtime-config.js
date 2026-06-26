import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const apiUrl = (process.env.VITE_API_URL || '').trim().replace(/\/$/, '');

const content = `window.__ALUMINIHIVE_API_URL__ = ${JSON.stringify(apiUrl)};\n`;
const outPath = path.join(root, 'public', 'runtime-config.js');

fs.writeFileSync(outPath, content, 'utf8');
console.log(
  '[runtime-config]',
  apiUrl
    ? `Wrote backend URL: ${apiUrl}`
    : 'No VITE_API_URL at build time (will infer backend from Render hostname at runtime)'
);
