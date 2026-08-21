#!/usr/bin/env node

import { chromium } from 'playwright';
import http from 'http';
import fs from 'fs';
import path from 'path';

const PORT = 8000;
const TIMEOUT_MS = 300000; // 5 minutes for all tests

// Simple HTTP server
function startServer() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      let filePath = path.join(process.cwd(), decodeURIComponent(req.url));
      if (filePath.endsWith('/')) {
        filePath = path.join(filePath, 'index.html');
      }

      try {
        const content = fs.readFileSync(filePath);
        const ext = path.extname(filePath);
        const mimeTypes = {
          '.html': 'text/html',
          '.js': 'application/javascript',
          '.css': 'text/css',
          '.png': 'image/png',
          '.svg': 'image/svg+xml',
          '.json': 'application/json'
        };
        res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'text/plain' });
        res.end(content);
      } catch (e) {
        res.writeHead(404);
        res.end('Not found');
      }
    });

    server.listen(PORT, () => {
      console.log(`[Server] Listening on http://localhost:${PORT}`);
      resolve(server);
    });
  });
}

async function runBenchmark() {
  const server = await startServer();
  const browser = await chromium.launch();
  const context = await browser.createContext();
  const page = await context.newPage();

  const results = [];
  const errors = [];

  page.on('console', (msg) => {
    const text = msg.text();
    console.log(text);
    if (text.includes('[FPS]')) {
      results.push(text);
    }
  });

  page.on('pageerror', (err) => {
    console.error('Page error:', err);
    errors.push(err.toString());
  });

  try {
    console.log(`[Test] Loading http://localhost:${PORT}#fps-bench`);
    await page.goto(`http://localhost:${PORT}#fps-bench`, { waitUntil: 'networkidle' });

    console.log('[Test] Waiting for benchmark completion...');

    // Wait for completion message
    await page.waitForFunction(
      () => window.FPSBench && window.FPSBench.results &&
            Object.keys(window.FPSBench.results).length === 4,
      { timeout: TIMEOUT_MS }
    );

    console.log('[Test] Benchmark complete, extracting results...');

    // Get results from page
    const pageResults = await page.evaluate(() => {
      return window.FPSBench.results;
    });

    console.log('\n[Results] Full benchmark output:');
    console.log(JSON.stringify(pageResults, null, 2));

    // Analyze results
    let allPass = true;
    const BUDGET = 16.67;

    Object.keys(pageResults).forEach((size) => {
      const sizeData = pageResults[size];
      console.log(`\n${size}×${size}:`);
      Object.keys(sizeData).forEach((scenario) => {
        const stats = sizeData[scenario];
        const pass = stats.median <= BUDGET;
        allPass = allPass && pass;
        console.log(`  ${pass ? '✓' : '✗'} ${scenario}: median=${stats.median.toFixed(2)}ms, p95=${stats.p95.toFixed(2)}ms`);
      });
    });

    process.exit(allPass ? 0 : 1);

  } catch (err) {
    console.error('Benchmark error:', err);
    process.exit(1);
  } finally {
    await browser.close();
    server.close();
  }
}

runBenchmark().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
