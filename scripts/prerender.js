/**
 * Post-build pre-rendering script.
 * Uses Playwright (already a devDep) to render the built SPA and save
 * the fully-rendered HTML back to dist/index.html so crawlers get real content.
 *
 * Usage: node scripts/prerender.js
 * Run AFTER `npm run build`.
 */

import { chromium } from "@playwright/test";
import { createServer } from "http";
import { readFileSync, writeFileSync } from "fs";
import { resolve, join, extname } from "path";
import { lookup } from "mime-types";

const DIST = resolve("dist");
const PORT = 4822;

// Minimal static file server for dist/
function startServer() {
  const server = createServer((req, res) => {
    let filePath = join(DIST, req.url === "/" ? "index.html" : req.url);

    // SPA fallback: if file doesn't exist, serve index.html
    try {
      const content = readFileSync(filePath);
      const mime = lookup(extname(filePath)) || "application/octet-stream";
      res.writeHead(200, { "Content-Type": mime });
      res.end(content);
    } catch {
      const html = readFileSync(join(DIST, "index.html"));
      res.writeHead(200, { "Content-Type": "text/html" });
      res.end(html);
    }
  });

  return new Promise((resolveP) => {
    server.listen(PORT, () => {
      console.log(`  Static server on http://localhost:${PORT}`);
      resolveP(server);
    });
  });
}

async function prerender() {
  console.log("⏳ Pre-rendering dist/index.html …");

  const server = await startServer();
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1200, height: 800 } });

  try {
    await page.goto(`http://localhost:${PORT}`, { waitUntil: "networkidle" });

    // Wait for the main content to render (treemap or any visible text)
    await page.waitForSelector("[id='root'] h1, [id='root'] h2, [id='root'] [class*='text']", {
      timeout: 15000,
    }).catch(() => {
      // If specific selectors aren't found, just wait a bit longer
      console.log("  ⚠ Specific selectors not found, waiting 3s extra…");
    });

    // Give React a moment to finish
    await page.waitForTimeout(2000);

    // Extract the rendered innerHTML of #root
    const rootHtml = await page.evaluate(() => {
      return document.getElementById("root")?.innerHTML ?? "";
    });

    if (!rootHtml || rootHtml.length < 100) {
      console.error("  ✗ Pre-render produced empty or minimal HTML, skipping.");
      return;
    }

    // Read the original dist/index.html
    const indexPath = join(DIST, "index.html");
    let html = readFileSync(indexPath, "utf-8");

    // Replace empty <div id="root"></div> with pre-rendered content
    html = html.replace(
      /<div id="root"><\/div>/,
      `<div id="root">${rootHtml}</div>`
    );

    // Add a meta tag indicating pre-render
    html = html.replace(
      "</head>",
      '  <meta name="prerender-status" content="200" />\n  </head>'
    );

    writeFileSync(indexPath, html, "utf-8");

    const sizeKb = (Buffer.byteLength(html) / 1024).toFixed(1);
    console.log(`  ✓ Pre-rendered dist/index.html (${sizeKb} KB)`);
    console.log(`  ✓ Injected ${(rootHtml.length / 1024).toFixed(1)} KB of pre-rendered content`);
  } finally {
    await browser.close();
    server.close();
  }
}

prerender().catch((err) => {
  console.error("Pre-render failed:", err.message);
  process.exit(1);
});
