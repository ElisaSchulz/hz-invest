/*
 * Regera as imagens de relatório usadas na landing page.
 *
 *   node tools/gerar-imagens-lp.js
 *
 * Produz duas coisas, a partir do relatório que está no repositório agora:
 *
 *   img/lp/relatorio-<arquetipo>.jpg      galeria dos oito exemplos (+ -sm)
 *   img/lp/modelo/<pagina>.jpg            páginas do relatório modelo, em A4
 *
 * Os perfis dos oito exemplos ficam em tools/perfis-galeria/*.json e o do
 * relatório modelo em tools/diagnostico-exemplo.json. Sempre que o desenho
 * do relatório mudar, rode isto de novo: sem isso a landing passa a mostrar
 * um relatório que não existe mais.
 *
 * Requer playwright + Chromium. Onde só houver o Chromium completo instalado,
 * aponte o binário com HZ_CHROMIUM=/caminho/para/chromium.
 */
"use strict";

const fs = require("fs");
const path = require("path");
const http = require("http");
const { execFileSync } = require("child_process");
const { chromium } = require("playwright");

const UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";
const ROOT = path.resolve(__dirname, "..");
const SAIDA = path.join(ROOT, "img", "lp");

// Qual seção do relatório vira a capa de cada card da galeria. O índice é a
// posição em `#report > section`, contando a capa como 0.
const GALERIA = {
  negacao:   { i: 2 }, ilusao:    { i: 6 }, adiamento: { i: 7 }, otimismo: { i: 8 },
  paralisia: { i: 3 }, vazamento: { i: 4 }, dominio:   { i: 8 }, colheita: { i: 7 },
};

// Páginas do relatório modelo que aparecem no leque da seção "o documento".
const MODELO = [[0, "capa"], [2, "score"], [4, "kpis"], [5, "distribuicao"], [7, "projecao"], [8, "plano"]];

const MIME = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".jpg": "image/jpeg", ".png": "image/png" };

function servidor() {
  const s = http.createServer((req, res) => {
    const rel = decodeURIComponent(req.url.split("?")[0]).replace(/^\/+/, "") || "index.html";
    const f = path.join(ROOT, rel);
    if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end(); return; }
    res.writeHead(200, { "Content-Type": MIME[path.extname(f).toLowerCase()] || "application/octet-stream" });
    fs.createReadStream(f).pipe(res);
  });
  return new Promise((ok) => s.listen(0, "127.0.0.1", () => ok(s)));
}

// O Chromium não alcança o Google Fonts atrás de proxy, e sem as fontes certas
// a captura sai com métricas erradas.
async function prepara(page, dados) {
  await page.route("**://cdn.jsdelivr.net/**", (r) => r.fulfill({ status: 200, contentType: "text/javascript", body: "" }));
  await page.route(/fonts\.(googleapis|gstatic)\.com/, async (route) => {
    const url = route.request().url();
    try {
      const body = execFileSync("curl", ["-sS", "-L", "-A", UA, url], { maxBuffer: 32 * 1024 * 1024 });
      route.fulfill({ status: 200, contentType: url.indexOf("googleapis") !== -1 ? "text/css" : "font/woff2", body });
    } catch (e) { route.abort(); }
  });
  await page.addInitScript((d) => localStorage.setItem("hz_diagnostico_data", JSON.stringify(d)), dados);
}

function caixa(sec) {
  return sec.evaluate((el) => {
    el.scrollIntoView();
    const r = el.getBoundingClientRect();
    return { x: r.x + scrollX, y: r.y + scrollY, width: r.width, height: r.height };
  });
}

(async () => {
  const server = await servidor();
  const base = "http://127.0.0.1:" + server.address().port + "/diagnostico-relatorio.html";
  const browser = await chromium.launch(process.env.HZ_CHROMIUM ? { executablePath: process.env.HZ_CHROMIUM } : {});

  // ---- galeria dos oito exemplos ----
  for (const [arq, cfg] of Object.entries(GALERIA)) {
    const dados = JSON.parse(fs.readFileSync(path.join(__dirname, "perfis-galeria", arq + ".json"), "utf8"));
    for (const [larg, sufixo] of [[900, ""], [640, "-sm"]]) {
      const page = await browser.newPage({ viewport: { width: larg, height: 1200 }, deviceScaleFactor: 2 });
      await prepara(page, dados);
      await page.goto(base, { waitUntil: "networkidle" });
      // o botão de imprimir é interface, e o recuo da seção viraria faixa vazia
      await page.addStyleTag({ content: ".no-print{display:none!important}#report>section{padding-top:34px!important;padding-bottom:34px!important}#report>section>.wrap,#report>section>.wrap-wide{max-width:none!important}" });
      await page.waitForTimeout(700);
      const secs = await page.$$("#report > section");
      const bb = await caixa(secs[cfg.i]);
      await page.screenshot({
        path: path.join(SAIDA, `relatorio-${arq}${sufixo}.jpg`), type: "jpeg", quality: 88, fullPage: true,
        clip: { x: bb.x, y: bb.y, width: bb.width, height: Math.min(bb.height, Math.round(larg * 0.625)) },
      });
      await page.close();
    }
    console.log("  galeria:", arq);
  }

  // ---- páginas do relatório modelo, em proporção de folha ----
  const dadosModelo = JSON.parse(fs.readFileSync(path.join(__dirname, "diagnostico-exemplo.json"), "utf8"));
  const page = await browser.newPage({ viewport: { width: 673, height: 1002 }, deviceScaleFactor: 2 });
  await prepara(page, dadosModelo);
  await page.goto(base, { waitUntil: "networkidle" });
  await page.emulateMedia({ media: "print" });     // 673x1002 = a área útil de um A4 com margem de 16mm
  await page.addStyleTag({ content: ".no-print{display:none!important}" });
  await page.waitForTimeout(800);
  fs.mkdirSync(path.join(SAIDA, "modelo"), { recursive: true });
  const secs = await page.$$("#report > section");
  for (const [i, nome] of MODELO) {
    const bb = await caixa(secs[i]);
    await page.screenshot({
      path: path.join(SAIDA, "modelo", nome + ".jpg"), type: "jpeg", quality: 86, fullPage: true,
      clip: { x: bb.x, y: bb.y, width: 673, height: 1002 },
    });
    console.log("  modelo:", nome);
  }

  await browser.close();
  server.close();
  console.log("imagens da landing page regeradas");
})().catch((e) => { console.error(e); process.exit(1); });
