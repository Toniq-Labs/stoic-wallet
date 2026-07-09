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
 * The NFT screen is the exception: its nftgeek API response and image requests
 * are mocked so the list table renders populated, which is what exercises the
 * mobile table-width behaviour.
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

// Mocked nftgeek response so the NFT list renders with real rows. Uses a
// special-cased canister (Cronics) so a preview image URL is produced, which we
// then fulfil with a placeholder below.
const NFT_CANISTER = 'qcg3w-tyaaa-aaaah-qakea-cai';
const MOCK_NFTS = {
  nfts: [0, 1, 2, 3].map(i => ({
    tokenid: 'aaaaa-aaaaa-' + i + '-cai-tokenid-' + i,
    tokenindex: 100 + i,
    canister: NFT_CANISTER,
    standard: 'EXT',
    floor: 250000000 + i * 50000000,
    floorUsd: 250000 + i * 50000,
  })),
  collections: [{canisterId: NFT_CANISTER, name: 'Demo Collection'}],
};
// 1x1 PNG, rendered at 64px by the thumbnail style — stands in for NFT art.
const PLACEHOLDER_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64',
);

const DEVICES = {
  mobile: {
    viewport: {width: 390, height: 844},
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  },
  desktop: {viewport: {width: 1280, height: 800}, deviceScaleFactor: 1},
};

async function shoot(browser, device, name, {seed, route, mock, action} = {}) {
  const context = await browser.newContext(DEVICES[device]);
  // Block external (non-localhost) requests so the page never hangs on IC/API
  // calls. On the NFT screen, fulfil the nftgeek response and image requests
  // with mock data instead so the list renders populated.
  await context.route('**/*', r => {
    const u = r.request().url();
    const p = u.split('?')[0];
    if (u.includes(`localhost:${PORT}`) || u.startsWith('data:')) return r.continue();
    if (mock && p.endsWith('/nfts')) {
      return r.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_NFTS),
      });
    }
    if (mock && (u.includes('.raw.icp0.io') || /\.(png|jpe?g|gif|webp|svg)$/i.test(p))) {
      return r.fulfill({status: 200, contentType: 'image/png', body: PLACEHOLDER_PNG});
    }
    return r.abort();
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
  if (action) {
    await action(page);
    await page.waitForTimeout(1500);
  }
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
      await shoot(browser, device, 'nft', {
        seed: true,
        mock: true,
        action: page => page.locator('text=NFTs').first().click(),
      });
      await shoot(browser, device, 'transactions', {seed: true});
      await shoot(browser, device, 'neurons', {seed: true, route: 'neurons'});
      await shoot(browser, device, 'addressbook', {seed: true, route: 'addressBook'});
      await shoot(browser, device, 'applications', {seed: true, route: 'applications'});
      await shoot(browser, device, 'settings', {seed: true, route: 'settings'});
    }
    // Mobile-only: the navigation drawer that the hamburger toggles open.
    console.log('mobile (drawer):');
    await shoot(browser, 'mobile', 'nav-drawer', {
      seed: true,
      action: page => page.locator('[aria-label="Toggle navigation menu"]').click(),
    });
  } finally {
    await browser.close();
    server.close();
  }
  console.log('Done ->', OUT);
})();
