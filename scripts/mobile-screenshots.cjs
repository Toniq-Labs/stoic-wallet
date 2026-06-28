/*
 * Mobile-responsiveness screenshot harness.
 *
 * Serves the production build and captures the key wallet screens at a phone
 * viewport (and a desktop viewport for comparison) using Playwright. A
 * watch-only wallet is seeded into localStorage so the authenticated wallet UI
 * renders without any secrets or live IC connectivity (network calls to
 * external hosts are aborted, so balances show their loading state — the point
 * here is layout, not data).
 *
 * Usage: npm run build && node scripts/mobile-screenshots.cjs [outDir]
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const {chromium} = require('playwright');

const BUILD = path.join(__dirname, '..', 'build');
const OUT = path.resolve(process.argv[2] || path.join(__dirname, '..', 'screenshots'));
const PORT = 4599;

const MIME = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

// Minimal SPA static server: serve the file if it exists, else index.html.
function serve() {
  return http.createServer((req, res) => {
    let urlPath = decodeURIComponent(req.url.split('?')[0]);
    let file = path.join(BUILD, urlPath);
    if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) {
      file = path.join(BUILD, 'index.html');
    }
    fs.readFile(file, (err, data) => {
      if (err) {
        res.writeHead(404);
        return res.end('not found');
      }
      res.writeHead(200, {'Content-Type': MIME[path.extname(file)] || 'application/octet-stream'});
      res.end(data);
    });
  });
}

// A watch-only wallet (no secrets needed to "unlock"). Format matches store.js.
const WATCH_DB = JSON.stringify([
  [
    {
      name: 'Demo',
      accounts: [['Main', []]],
      neurons: [],
      apps: [],
      identity: {principal: '2vxsx-fae', type: 'watch'},
    },
  ],
  [],
  [0, 0, 0],
  2,
]);

const DEVICES = {
  mobile: {
    viewport: {width: 390, height: 844},
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  },
  desktop: {viewport: {width: 1280, height: 800}, deviceScaleFactor: 1},
};

async function shoot(browser, device, name, {seed, route} = {}) {
  const context = await browser.newContext(DEVICES[device]);
  // Block external (non-localhost) requests so the page never hangs on IC/API calls.
  await context.route('**/*', r => {
    const u = r.request().url();
    return u.includes(`localhost:${PORT}`) || u.startsWith('data:') ? r.continue() : r.abort();
  });
  if (seed) {
    await context.addInitScript(
      ([db, rt]) => {
        localStorage.setItem('_db', db);
        if (rt) localStorage.setItem('stoic-route', rt);
      },
      [WATCH_DB, route || ''],
    );
  }
  const page = await context.newPage();
  await page.goto(`http://localhost:${PORT}/`, {waitUntil: 'domcontentloaded'});
  await page.waitForTimeout(2500);
  const out = path.join(OUT, `${name}-${device}.png`);
  await page.screenshot({path: out, fullPage: false});
  console.log('  saved', path.relative(process.cwd(), out));
  await context.close();
}

(async () => {
  fs.mkdirSync(OUT, {recursive: true});
  const server = serve();
  await new Promise(r => server.listen(PORT, r));
  const browser = await chromium.launch();
  try {
    for (const device of ['mobile', 'desktop']) {
      console.log(device + ':');
      await shoot(browser, device, 'connect', {});
      await shoot(browser, device, 'account', {seed: true});
      await shoot(browser, device, 'applications', {seed: true, route: 'applications'});
      await shoot(browser, device, 'settings', {seed: true, route: 'settings'});
    }
  } finally {
    await browser.close();
    server.close();
  }
  console.log('Done ->', OUT);
})();
