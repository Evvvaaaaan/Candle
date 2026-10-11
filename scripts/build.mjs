import { cp, mkdir, writeFile, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const out = path.join(root, 'dist');
const base = process.env.CANDLE_API_BASE_URL || '/api/v1';
if (!(base.startsWith('/') && !base.startsWith('//')) && !/^https:\/\//.test(base))
  throw Error('CANDLE_API_BASE_URL must be an absolute path or HTTPS URL');
await rm(out, { recursive: true, force: true });
await mkdir(out, { recursive: true });
for (const file of [
  'index.html',
  'core-flow.html',
  'src/css/base/reset.css',
  'src/css/core-flow.css',
  'src/assets/core-flow',
  'src/js/core-flow.js',
  'src/js/screens',
  'src/js/ui',
  'src/js/api-client.mjs',
  'src/js/candle-service.mjs',
]) {
  await mkdir(path.dirname(path.join(out, file)), { recursive: true });
  await cp(path.join(root, file), path.join(out, file), { recursive: true });
}
await writeFile(
  path.join(out, 'config.js'),
  `window.CANDLE_CONFIG = ${JSON.stringify({ mode: 'api', apiBaseUrl: base, requestTimeoutMs: 12000 })};\n`
);
await writeFile(
  path.join(out, '_headers'),
  `/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n  Permissions-Policy: camera=(), microphone=(), geolocation=()\n  Content-Security-Policy: frame-ancestors 'none'; base-uri 'self'; object-src 'none'\n  Cache-Control: no-cache\n`
);
console.log('Built dist: API mode only; demo, legacy pages, tests and development files excluded.');
