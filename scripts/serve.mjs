import http from 'node:http';
import { readFile, realpath } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import { createDemoService, freshAccount, ACCOUNT_KEY } from '../src/js/demo-service.mjs';
import { mutations } from '../src/js/candle-service.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
};
export function createServer({ contract = false, directory = root } = {}) {
  const sessions = new Map();
  const json = (res, status, value) => {
    res.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
    res.end(JSON.stringify(value));
  };
  return http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url, 'http://localhost');
      if (url.pathname.startsWith('/api/v1/')) {
        if (!contract) return json(res, 503, { success: false, error: { code: 'SERVER_ERROR' } });
        // Local contract simulator only: never included in the production build.
        const route = url.pathname.slice('/api/v1'.length);
        const cookie = req.headers.cookie?.match(/(?:^|;\s*)candle_fixture=([^;]+)/)?.[1];
        let service = sessions.get(cookie);
        if (/^\/auth\/(kakao|naver|google|apple)\/start$/.test(route)) {
          const target = new URL(
            url.searchParams.get('returnTo') || '/core-flow.html?mode=api',
            `http://${req.headers.host}`
          );
          if (target.origin !== `http://${req.headers.host}`)
            return json(res, 400, { success: false, error: { code: 'VALIDATION_ERROR' } });
          const store = new Map([[ACCOUNT_KEY, JSON.stringify({ ...freshAccount(), user: null })]]);
          service = createDemoService({
            getItem: (key) => store.get(key) || null,
            setItem: (key, value) => store.set(key, value),
          });
          await service.login();
          const id = randomUUID();
          sessions.set(id, service);
          target.searchParams.set('mode', 'api');
          target.hash = 'consent';
          res.writeHead(302, {
            'Set-Cookie': `candle_fixture=${id}; HttpOnly; SameSite=Lax; Path=/`,
            Location: target.href,
          });
          res.end();
          return;
        }
        if (route === '/auth/session' && req.method === 'GET')
          return json(
            res,
            200,
            service
              ? await service.session()
              : { user: null, providers: ['kakao', 'naver', 'google', 'apple'], csrfToken: null }
          );
        if (route === '/legal/agreements/current' && req.method === 'GET') {
          const { demoLegal } = await import('../src/js/demo-service.mjs');
          return json(res, 200, demoLegal);
        }
        if (!service) return json(res, 401, { success: false, error: { code: 'SESSION_EXPIRED' } });
        if (req.method === 'GET') {
          const data = await service.load();
          const get = {
            '/stocks/top-list': data.stocks.map((s) => ({
              ticker: s.code,
              name: s.name,
              currentPrice: s.price.replace(/[^\d]/g, ''),
              changeRate: s.change.replace('%', ''),
              changePrice: '0',
              logoUrl: null,
              market: s.market,
            })),
            '/prediction-tickets': data.tickets,
            '/predictions/today': data.predictions,
            '/predictions/history': { items: data.predictions.items, nextCursor: null },
            '/wallet': data.wallet,
            '/wallet/transactions': { items: data.wallet.items, nextCursor: null },
            '/missions': data.missions,
            '/rewards/catalog': data.catalog,
            '/reward-claims': data.claims,
          };
          if (route in get) return json(res, 200, get[route]);
        } else {
          if (req.headers['x-csrf-token'] !== 'demo-only')
            return json(res, 403, { success: false, error: { code: 'CSRF_INVALID' } });
          if (!req.headers['idempotency-key'])
            return json(res, 400, { success: false, error: { code: 'VALIDATION_ERROR' } });
          let raw = '';
          for await (const chunk of req) {
            raw += chunk;
            if (raw.length > 8192)
              return json(res, 413, { success: false, error: { code: 'VALIDATION_ERROR' } });
          }
          const body = raw ? JSON.parse(raw) : {};
          const action = Object.keys(mutations).find(
            (key) => mutations[key][0] === req.method && mutations[key][1] === route
          );
          if (action) {
            const value = await service.mutate(action, body, req.headers['idempotency-key']);
            if (action === 'logout') {
              sessions.delete(cookie);
              res.setHeader('Set-Cookie', 'candle_fixture=; Max-Age=0; Path=/; HttpOnly; SameSite=Lax');
            }
            if (action === 'adStart')
              value.launchUrl = `https://example.com/fixture-ad/${encodeURIComponent(value.id)}`;
            return json(res, 200, value);
          }
        }
        return json(res, 404, { success: false, error: { code: 'NOT_FOUND' } });
      }
      if (req.method !== 'GET' && req.method !== 'HEAD') {
        res.writeHead(405);
        res.end();
        return;
      }
      const pathname = decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname);
      if (!/^\/(index\.html|core-flow\.html|config\.js|src\/(assets|css|js)\/[^?]+)$/.test(pathname)) {
        res.writeHead(404);
        res.end();
        return;
      }
      const file = await realpath(path.join(directory, pathname));
      if (!file.startsWith((await realpath(directory)) + path.sep)) {
        res.writeHead(403);
        res.end();
        return;
      }
      const body = await readFile(file);
      res.writeHead(200, {
        'Content-Type': types[path.extname(file)] || 'application/octet-stream',
        'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff',
      });
      res.end(req.method === 'HEAD' ? undefined : body);
    } catch (error) {
      if (error.code === 'ENOENT') {
        res.writeHead(404);
        res.end();
      } else
        json(res, error.code === 'INSUFFICIENT_POINTS' ? 409 : 400, {
          success: false,
          error: { code: error.code || 'VALIDATION_ERROR' },
        });
    }
  });
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const contract = process.argv.includes('--contract');
  const port = Number(process.env.PORT || (contract ? 4174 : 4173));
  const server = createServer({ contract });
  server.listen(port, '127.0.0.1', () =>
    console.log(
      `Candle ${contract ? 'CONTRACT SIMULATOR (not a real backend)' : 'preview'}: http://127.0.0.1:${port}/${contract ? '?mode=api' : ''}`
    )
  );
}
