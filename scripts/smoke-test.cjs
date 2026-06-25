#!/usr/bin/env node
/*
 * Headless smoke test — catches runtime breakage a plain build can't.
 * Serves ./build, loads it in headless Chromium, and FAILS if the app doesn't
 * render or throws a fatal JS error (e.g. a missing webpack polyfill like
 * `process is not defined`). Network errors (no mainnet in CI) are ignored.
 *
 *   npm run build && npm run smoke
 */
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(process.cwd(), 'build');
const PORT = Number(process.env.SMOKE_PORT || 8099);
const MT = {'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json',
  '.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml','.ico':'image/x-icon',
  '.woff':'font/woff','.woff2':'font/woff2','.ttf':'font/ttf','.map':'application/json','.wasm':'application/wasm'};
const IGNORE = /ERR_NAME_NOT_RESOLVED|ERR_INTERNET_DISCONNECTED|ERR_CONNECTION|ERR_ADDRESS|net::|Failed to load resource/i;

function serve() {
  return http.createServer((q, s) => {
    let p = path.normalize(path.join(ROOT, decodeURIComponent(q.url.split('?')[0])));
    if (!p.startsWith(ROOT)) p = path.join(ROOT, 'index.html');
    fs.stat(p, (e, st) => {
      const f = !e && st.isFile() ? p : path.join(ROOT, 'index.html');
      s.setHeader('Content-Type', MT[path.extname(f)] || 'application/octet-stream');
      fs.createReadStream(f).pipe(s);
    });
  });
}

(async () => {
  if (!fs.existsSync(path.join(ROOT, 'index.html'))) {
    console.error('smoke: no build/ found — run `npm run build` first');
    process.exit(2);
  }
  let puppeteer;
  try { puppeteer = require('puppeteer'); }
  catch { console.error('smoke: puppeteer not installed (npm i -D puppeteer)'); process.exit(2); }

  const server = serve();
  await new Promise((r) => server.listen(PORT, r));
  const fatal = [];
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });
  const page = await browser.newPage();
  page.on('pageerror', (e) => fatal.push('Uncaught: ' + e.message.split('\n')[0]));
  page.on('console', (m) => {
    if (m.type() === 'error' && !IGNORE.test(m.text())) fatal.push('console.error: ' + m.text().slice(0, 200));
  });
  try { await page.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: 'networkidle2', timeout: 30000 }); }
  catch (e) { fatal.push('navigation: ' + e.message); }
  await new Promise((r) => setTimeout(r, 2500));
  const rootLen = await page.evaluate(() => (document.getElementById('root') || {}).innerHTML?.length || 0);
  await browser.close();
  server.close();

  console.log(`smoke: #root rendered ${rootLen} chars, ${fatal.length} fatal error(s)`);
  if (rootLen < 20) fatal.push('app did not render (#root is empty)');
  if (fatal.length) {
    console.error('SMOKE TEST FAILED:');
    fatal.forEach((e) => console.error('  - ' + e));
    process.exit(1);
  }
  console.log('✓ smoke test passed');
})().catch((e) => { console.error('smoke: harness error:', e.message); process.exit(2); });
