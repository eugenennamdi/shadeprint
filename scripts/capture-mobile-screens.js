import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';

const ARTIFACT_DIR = '/Users/apple/.gemini/antigravity/brain/4c086520-5f2f-4f53-b5e4-478187b62375';
const DIST_DIR = path.resolve(process.cwd(), 'dist');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.wasm': 'application/wasm',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
};

function startServer() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      let reqPath = req.url.split('?')[0];
      if (reqPath === '/') reqPath = '/index.html';
      const filePath = path.join(DIST_DIR, reqPath);

      if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
        const ext = path.extname(filePath);
        res.writeHead(200, {
          'Content-Type': MIME_TYPES[ext] || 'application/octet-stream',
          'Access-Control-Allow-Origin': '*',
        });
        fs.createReadStream(filePath).pipe(res);
      } else {
        const indexHtml = path.join(DIST_DIR, 'index.html');
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        fs.createReadStream(indexHtml).pipe(res);
      }
    });

    server.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      console.log(`[Server] Listening on http://127.0.0.1:${port}`);
      resolve({ server, port });
    });
  });
}

class CDPClient {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.id = 1;
    this.pending = new Map();
  }

  connect() {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.wsUrl);
      this.ws.onopen = () => resolve();
      this.ws.onerror = (err) => reject(err);
      this.ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.id && this.pending.has(msg.id)) {
          const { resolve, reject } = this.pending.get(msg.id);
          this.pending.delete(msg.id);
          if (msg.error) reject(new Error(msg.error.message));
          else resolve(msg.result);
        }
      };
    });
  }

  send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = this.id++;
      this.pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async eval(expression) {
    const res = await this.send('Runtime.evaluate', {
      expression,
      awaitPromise: true,
      returnByValue: true,
    });
    return res?.result?.value;
  }

  async captureScreenshot(filename) {
    const res = await this.send('Page.captureScreenshot', {
      format: 'png',
      quality: 100,
      fromSurface: true,
    });
    const outPath = path.join(ARTIFACT_DIR, filename);
    fs.writeFileSync(outPath, Buffer.from(res.data, 'base64'));
    console.log(`[Screenshot] Saved ${filename} (${fs.statSync(outPath).size} bytes)`);
    return outPath;
  }
}

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  const { server, port } = await startServer();

  const chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  const userDataDir = `/tmp/shadeprint-headless-${Date.now()}`;
  fs.mkdirSync(userDataDir, { recursive: true });

  const cdpPort = 9222 + Math.floor(Math.random() * 500);

  console.log(`[Chrome] Launching on CDP port ${cdpPort}...`);
  const chromeProc = spawn(chromePath, [
    '--headless=new',
    '--disable-gpu',
    `--remote-debugging-port=${cdpPort}`,
    `--user-data-dir=${userDataDir}`,
    '--no-first-run',
    '--no-default-browser-check',
  ]);

  await sleep(1500);

  try {
    const listRes = await fetch(`http://127.0.0.1:${cdpPort}/json/list`).then((r) => r.json());
    const pageTarget = listRes.find((t) => t.type === 'page');
    if (!pageTarget) throw new Error('No page target found');

    const client = new CDPClient(pageTarget.webSocketDebuggerUrl);
    await client.connect();

    // 390px viewport (iPhone 12/13/14 Pro: 390 x 844, 2x DPR)
    await client.send('Emulation.setDeviceMetricsOverride', {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true,
    });

    await client.send('Page.enable');
    await client.send('Runtime.enable');

    console.log('[Browser] Seeding completed field session in IndexedDB...');
    await client.send('Page.navigate', { url: `http://127.0.0.1:${port}` });
    await sleep(1500);

    // Seed Completed Field Session & In-Progress Session in IndexedDB
    await client.eval(`
      new Promise((resolve, reject) => {
        const req = indexedDB.open('shadeprint_db', 1);
        req.onupgradeneeded = (e) => {
          const db = e.target.result;
          if (!db.objectStoreNames.contains('sessions')) {
            db.createObjectStore('sessions', { keyPath: 'id' });
          }
          if (!db.objectStoreNames.contains('observations')) {
            const obs = db.createObjectStore('observations', { keyPath: 'id' });
            obs.createIndex('sessionId', 'sessionId', { unique: false });
          }
        };
        req.onsuccess = (e) => {
          const db = e.target.result;
          const tx = db.transaction('sessions', 'readwrite');
          const store = tx.objectStore('sessions');
          
          const completedSession = {
            id: 'demo-completed-01',
            startedAt: new Date(Date.now() - 3600000).toISOString(),
            completedAt: new Date().toISOString(),
            mode: 'field',
            observations: [
              {
                id: 'obs-01',
                sessionId: 'demo-completed-01',
                createdAt: new Date(Date.now() - 3000000).toISOString(),
                photoDataUrl: '/samples/sample_tree_shade.jpg',
                locationLabel: 'Elm Grove Sidewalk',
                aiSuggestedCategory: 'tree_shade',
                finalCategory: 'tree_shade',
                modelStatus: 'success',
                userNote: 'Continuous mature canopy keeping pavement cool',
                modelScoreDetails: [
                  { category: 'tree_shade', score: 0.82 },
                  { category: 'built_shade', score: 0.11 },
                  { category: 'exposed', score: 0.07 }
                ]
              },
              {
                id: 'obs-02',
                sessionId: 'demo-completed-01',
                createdAt: new Date(Date.now() - 2000000).toISOString(),
                photoDataUrl: '/samples/sample_built_shade.jpg',
                locationLabel: 'Market Row Arcade',
                aiSuggestedCategory: 'built_shade',
                finalCategory: 'built_shade',
                modelStatus: 'success',
                userNote: 'Deep storefront awning shadow over pedestrian walkway',
                modelScoreDetails: [
                  { category: 'tree_shade', score: 0.09 },
                  { category: 'built_shade', score: 0.84 },
                  { category: 'exposed', score: 0.07 }
                ]
              },
              {
                id: 'obs-03',
                sessionId: 'demo-completed-01',
                createdAt: new Date(Date.now() - 1000000).toISOString(),
                photoDataUrl: '/samples/sample_exposed.jpg',
                locationLabel: 'Sunny Plaza Crosswalk',
                aiSuggestedCategory: 'exposed',
                finalCategory: 'exposed',
                modelStatus: 'success',
                userNote: 'Bright direct sun across wide open asphalt',
                modelScoreDetails: [
                  { category: 'tree_shade', score: 0.05 },
                  { category: 'built_shade', score: 0.08 },
                  { category: 'exposed', score: 0.87 }
                ]
              }
            ]
          };

          store.put(completedSession);
          tx.oncomplete = () => resolve(true);
          tx.onerror = (err) => reject(err);
        };
      });
    `);

    // Reload page to reflect seeded session
    await client.send('Page.navigate', { url: `http://127.0.0.1:${port}` });
    await sleep(1500);

    // 1. Introduction Screen (showing Saved Field Reports)
    console.log('[Capture 1] Introduction Screen (390px)...');
    await client.captureScreenshot('screenshot_01_intro.png');

    // 2. Open About Modal
    console.log('[Capture 2] About Modal (390px)...');
    await client.eval(`
      const aboutBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('About'));
      if (aboutBtn) aboutBtn.click();
    `);
    await sleep(600);
    await client.captureScreenshot('screenshot_02_about.png');

    // Close About Modal
    await client.eval(`
      const closeBtn = document.querySelector('button[aria-label="Close dialog"]');
      if (closeBtn) closeBtn.click();
    `);
    await sleep(400);

    // 3. Photo Capture Screen
    console.log('[Capture 3] Photo Capture Screen (390px)...');
    await client.eval(`
      const startBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Start exploring'));
      if (startBtn) startBtn.click();
    `);
    await sleep(600);
    await client.captureScreenshot('screenshot_03_capture.png');

    // 4. Observation Review Screen with Sample Photo
    console.log('[Capture 4] Observation Review Screen (390px)...');
    await client.eval(`
      const cancelBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Cancel walk'));
      if (cancelBtn) cancelBtn.click();
    `);
    await sleep(400);
    await client.eval(`
      const sampleBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('sample photos'));
      if (sampleBtn) sampleBtn.click();
    `);
    await sleep(600);
    await client.eval(`
      const analyzeBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Analyze'));
      if (analyzeBtn) analyzeBtn.click();
    `);
    await sleep(600);
    await client.captureScreenshot('screenshot_04_review.png');
    await client.eval('window.scrollTo(0, 500)');
    await sleep(300);
    await client.captureScreenshot('screenshot_04_review_scrolled.png');

    // 4b. Trigger persistence error to capture error banner and retry button
    console.log('[Capture 4b] Simulating persistence error on Review Screen (390px)...');
    await client.eval(`
      window._origOpen = indexedDB.open;
      indexedDB.open = function() {
        const req = {};
        setTimeout(() => {
          if (req.onerror) req.onerror({ target: { error: new Error('QuotaExceededError: Local disk storage quota exceeded.') } });
        }, 10);
        return req;
      };
      const confirmBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Confirm observation'));
      if (confirmBtn) confirmBtn.click();
    `);
    await sleep(800);
    await client.captureScreenshot('screenshot_04_persistence_error.png');
    // Restore indexedDB.open
    await client.eval(`if (window._origOpen) indexedDB.open = window._origOpen;`);

    // 5. Open Saved Report to capture Field Report Screen
    console.log('[Capture 5] Field Report Screen (390px)...');
    await client.send('Page.navigate', { url: `http://127.0.0.1:${port}` });
    
    // Wait for past sessions to load from IndexedDB and click saved report
    let reportClicked = false;
    for (let i = 0; i < 20; i++) {
      await sleep(300);
      reportClicked = await client.eval(`
        (() => {
          const cards = Array.from(document.querySelectorAll('div'));
          const target = cards.find(d => d.textContent && d.textContent.includes('Neighborhood Field Walk') && d.className.includes('cursor-pointer'));
          if (target) {
            target.click();
            return true;
          }
          return false;
        })()
      `);
      if (reportClicked) break;
    }
    console.log(`[Capture 5] Clicked saved report card: ${reportClicked}`);
    await sleep(1000);
    await client.captureScreenshot('screenshot_06_report.png');

    // 6. Between Stops Screen: seed an in-progress session with 2 stops and resume it
    console.log('[Capture 6] Between Stops Screen (390px)...');
    await client.eval(`
      new Promise((resolve) => {
        const req = indexedDB.open('shadeprint_db', 1);
        req.onsuccess = (e) => {
          const db = e.target.result;
          const tx = db.transaction('sessions', 'readwrite');
          const store = tx.objectStore('sessions');
          const activeSess = {
            id: 'in-progress-walk-seeded',
            startedAt: new Date(Date.now() - 1200000).toISOString(),
            mode: 'field',
            observations: [
              {
                id: 'obs-01',
                sessionId: 'in-progress-walk-seeded',
                createdAt: new Date().toISOString(),
                photoDataUrl: '/samples/sample_tree_shade.jpg',
                locationLabel: 'Elm Grove Sidewalk',
                finalCategory: 'tree_shade',
                modelStatus: 'success',
              },
              {
                id: 'obs-02',
                sessionId: 'in-progress-walk-seeded',
                createdAt: new Date().toISOString(),
                photoDataUrl: '/samples/sample_built_shade.jpg',
                locationLabel: 'Market Row Arcade',
                finalCategory: 'built_shade',
                modelStatus: 'success',
              }
            ]
          };
          store.put(activeSess);
          tx.oncomplete = () => resolve(true);
        };
      });
    `);

    // Reload intro
    await client.send('Page.navigate', { url: `http://127.0.0.1:${port}` });
    
    // Wait for in-progress banner to load and click Resume walk
    let resumeClicked = false;
    for (let i = 0; i < 20; i++) {
      await sleep(300);
      resumeClicked = await client.eval(`
        (() => {
          const buttons = Array.from(document.querySelectorAll('button'));
          const btn = buttons.find(b => b.textContent && b.textContent.includes('Resume walk'));
          if (btn) {
            btn.click();
            return true;
          }
          return false;
        })()
      `);
      if (resumeClicked) break;
    }
    console.log(`[Capture 6] Clicked resume walk: ${resumeClicked}`);
    await sleep(1000);
    await client.captureScreenshot('screenshot_05_between.png');

    console.log('[Success] All targeted mobile screens successfully captured at 390px!');
  } finally {
    chromeProc.kill('SIGKILL');
    server.close();
    fs.rmSync(userDataDir, { recursive: true, force: true });
  }
}

main().catch((err) => {
  console.error('[Error]', err);
  process.exit(1);
});
