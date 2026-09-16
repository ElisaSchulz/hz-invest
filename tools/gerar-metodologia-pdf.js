/*
 * Gera o PDF do documento de metodologia do diagnóstico.
 *
 *   node tools/gerar-metodologia-pdf.js [saida.pdf]
 *
 * Mesmo esquema do gerar-relatorio-pdf.js: sobe um servidor estático na raiz
 * do repositório e imprime a página. A diferença é que aqui não há dados a
 * injetar — a página de metodologia é estática.
 *
 * Requer playwright + Chromium instalados. Em ambientes onde só existe o
 * Chromium completo (sem o "headless shell"), aponte o binário com
 * HZ_CHROMIUM=/caminho/para/chromium.
 */
"use strict";

const fs = require("fs");
const path = require("path");
const http = require("http");
const { execFileSync } = require("child_process");
const { chromium } = require("playwright");

const UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

const ROOT = path.resolve(__dirname, "..");
const PAGINA = "docs/metodologia-score-arquetipos.html";
const saidaPath = path.resolve(process.argv[2] || path.join(ROOT, "docs", "metodologia-score-arquetipos.pdf"));

const MIME = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp", ".ico": "image/x-icon" };

function servidor() {
  const server = http.createServer((req, res) => {
    const rel = decodeURIComponent(req.url.split("?")[0]).replace(/^\/+/, "") || "index.html";
    const file = path.join(ROOT, rel);
    if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
      res.writeHead(404); res.end("not found"); return;
    }
    res.writeHead(200, { "Content-Type": MIME[path.extname(file).toLowerCase()] || "application/octet-stream" });
    fs.createReadStream(file).pipe(res);
  });
  return new Promise((ok) => server.listen(0, "127.0.0.1", () => ok(server)));
}

(async () => {
  const server = await servidor();
  const base = "http://127.0.0.1:" + server.address().port;
  const browser = await chromium.launch(process.env.HZ_CHROMIUM ? { executablePath: process.env.HZ_CHROMIUM } : {});
  const page = await browser.newPage({ viewport: { width: 1180, height: 1400 } });

  // As fontes (Fraunces/Manrope) vêm do Google Fonts. Em ambientes com proxy o
  // Chromium não alcança a rede sozinho, então buscamos via curl.
  await page.route(/fonts\.(googleapis|gstatic)\.com/, async (route) => {
    const url = route.request().url();
    try {
      const body = execFileSync("curl", ["-sS", "-L", "-A", UA, url], { maxBuffer: 32 * 1024 * 1024 });
      route.fulfill({ status: 200, contentType: url.indexOf("googleapis") !== -1 ? "text/css" : "font/woff2", body });
    } catch (e) {
      route.abort();
    }
  });

  await page.goto(base + "/" + PAGINA, { waitUntil: "networkidle" });
  await page.emulateMedia({ media: "print" });
  await page.waitForTimeout(1200);

  await page.pdf({ path: saidaPath, format: "A4", printBackground: true, preferCSSPageSize: true });

  await browser.close();
  server.close();
  console.log("PDF gerado em " + saidaPath);
})().catch((e) => { console.error(e); process.exit(1); });
