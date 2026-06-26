import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const apiUrl = (process.env.VITE_API_URL || '').trim().replace(/\/$/, '');

const content = `window.__ALUMINIHIVE_API_URL__ = ${JSON.stringify(apiUrl)};

(function () {
  var base = window.__ALUMINIHIVE_API_URL__;
  var host = window.location.hostname;

  if (!base && host.indexOf('-frontend') !== -1 && host.endsWith('.onrender.com')) {
    base = window.location.protocol + '//' + host.replace('-frontend', '-backend');
    window.__ALUMINIHIVE_API_URL__ = base;
  }

  if (!base) return;

  var originalFetch = window.fetch.bind(window);
  window.fetch = function (input, init) {
    if (typeof input === 'string' && input.indexOf('/api/') === 0) {
      input = base + input;
    }
    return originalFetch(input, init);
  };
})();
`;

const outPath = path.join(root, 'public', 'runtime-config.js');
fs.writeFileSync(outPath, content, 'utf8');
console.log('[runtime-config]', apiUrl || 'Will infer backend from Render hostname at runtime');
