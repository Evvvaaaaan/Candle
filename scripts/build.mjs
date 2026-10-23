import { cp, mkdir, writeFile, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const out = path.join(root, 'dist');
await rm(out, { recursive: true, force: true });
await mkdir(out, { recursive: true });
for (const file of ['index.html', 'core-flow.html']) {
  await mkdir(path.dirname(path.join(out, file)), { recursive: true });
  await cp(path.join(root, file), path.join(out, file), { recursive: true });
}
await writeFile(
  path.join(out, '_headers'),
  `/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n  Permissions-Policy: camera=(), microphone=(), geolocation=()\n  Content-Security-Policy: frame-ancestors 'none'; base-uri 'self'; object-src 'none'\n  Cache-Control: no-cache\n`
);
console.log('Built dist: self-contained HTML; styles, input/display code, images and fonts are embedded.');
