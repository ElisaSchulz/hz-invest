/*
 * Gera um PDF do relatório do diagnóstico a partir de um JSON de respostas.
 *
 *   node tools/gerar-relatorio-pdf.js [dados.json] [saida.pdf]
 *
 * O script sobe um servidor estático na raiz do repositório, injeta o JSON em
 * localStorage (mesma chave que o formulário usa) e imprime diagnostico-relatorio.html.
 * Requer playwright + Chromium instalados.
 */
"use strict";

const fs = require("fs");
const path = require("path");
const http = require("http");
const { execFileSync } = require("child_process");
const { chromium } = require("playwright");

const UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

const ROOT = path.resolve(__dirname, "..");
const dadosPath = path.resolve(process.argv[2] || path.join(__dirname, "diagnostico-exemplo.json"));
const saidaPath = path.resolve(process.argv[3] || path.join(ROOT, "relatorio-diagnostico-modelo.pdf"));

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
  const stored = JSON.parse(fs.readFileSync(dadosPath, "utf8"));
  const server = await servidor();
  const base = "http://127.0.0.1:" + server.address().port;
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1180, height: 1400 } });

  // Sem rede externa o Supabase não carrega; o relatório não depende dele.
  await page.route("**://cdn.jsdelivr.net/**", (r) => r.fulfill({ status: 200, contentType: "text/javascript", body: "" }));

  // As fontes do relatório (Fraunces/Manrope) vêm do Google Fonts. Em ambientes
  // com proxy o Chromium não alcança a rede sozinho, então buscamos via curl.
  await page.route(/fonts\.(googleapis|gstatic)\.com/, async (route) => {
    const url = route.request().url();
    try {
      const body = execFileSync("curl", ["-sS", "-L", "-A", UA, url], { maxBuffer: 32 * 1024 * 1024 });
      route.fulfill({ status: 200, contentType: url.indexOf("googleapis") !== -1 ? "text/css" : "font/woff2", body });
    } catch (e) {
      route.abort();
    }
  });

  await page.goto(base + "/diagnostico-relatorio.html", { waitUntil: "domcontentloaded" });
  await page.evaluate((s) => localStorage.setItem("hz_diagnostico_data", JSON.stringify(s)), stored);
  await page.goto(base + "/diagnostico-relatorio.html", { waitUntil: "networkidle" });
  await page.waitForSelector("#report section");
  await page.emulateMedia({ media: "print" });
  await page.waitForTimeout(1200);

  await page.pdf({ path: saidaPath, format: "A4", printBackground: true, preferCSSPageSize: true });

  await browser.close();
  server.close();
  console.log("PDF gerado em " + saidaPath);
})().catch((e) => { console.error(e); process.exit(1); });
