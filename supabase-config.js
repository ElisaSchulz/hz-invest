// ─────────────────────────────────────────────────────────────
//  supabase-config.js — HZ Invest
//  Integração do Diagnóstico Financeiro com o Supabase:
//  grava as respostas do formulário na tabela `diagnosticos` e
//  envia o relatório gerado (HTML) para o bucket `relatorios`.
//
//  COMO CONFIGURAR:
//  1. Rode o script `supabase-setup.sql` no SQL Editor do painel
//     do Supabase (uma única vez).
//  2. Preencha as duas constantes abaixo com os dados do seu
//     projeto (painel do Supabase > Settings > API):
//     - Project URL  → HZ_SUPABASE_URL
//     - anon public  → HZ_SUPABASE_ANON_KEY
//
//  A chave "anon" é pública por definição — a segurança vem das
//  políticas de RLS criadas pelo setup: visitantes só conseguem
//  INSERIR respostas e ENVIAR arquivos, nunca ler os dados dos
//  outros. Você acessa tudo pelo painel do Supabase.
//
//  Enquanto as constantes não forem preenchidas, o site funciona
//  normalmente — apenas não envia nada para o Supabase.
// ─────────────────────────────────────────────────────────────

var HZ_SUPABASE_URL = "https://SEU-PROJETO.supabase.co";
var HZ_SUPABASE_ANON_KEY = "COLE-AQUI-SUA-CHAVE-ANON-PUBLICA";

(function () {
  "use strict";

  var TABELA = "diagnosticos";
  var BUCKET = "relatorios";

  var K_DATA = "hz_diagnostico_data";      // respostas finalizadas (já usado pelas páginas)
  var K_ID = "hz_diagnostico_id";          // id do envio atual
  var K_ARQUIVO = "hz_diagnostico_arquivo"; // caminho do relatório no Storage
  var K_SYNC = "hz_diagnostico_sync";      // "ok" quando as respostas já foram gravadas
  var K_UPLOAD = "hz_diagnostico_upload";  // "ok" quando o relatório já foi enviado

  function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  function lsDel(k) { try { localStorage.removeItem(k); } catch (e) {} }

  function configurado() {
    return HZ_SUPABASE_URL.indexOf("SEU-PROJETO") === -1 &&
      HZ_SUPABASE_ANON_KEY.indexOf("COLE-AQUI") === -1 &&
      HZ_SUPABASE_ANON_KEY.length > 20;
  }

  var _client = null;
  function client() {
    if (!configurado() || !window.supabase || !window.supabase.createClient) return null;
    if (!_client) _client = window.supabase.createClient(HZ_SUPABASE_URL, HZ_SUPABASE_ANON_KEY);
    return _client;
  }

  function uuid4() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    var b = new Uint8Array(16);
    if (window.crypto && crypto.getRandomValues) crypto.getRandomValues(b);
    else for (var i = 0; i < 16; i++) b[i] = Math.floor(Math.random() * 256);
    b[6] = (b[6] & 15) | 64;
    b[8] = (b[8] & 63) | 128;
    var h = "";
    for (var j = 0; j < 16; j++) h += ("0" + b[j].toString(16)).slice(-2);
    return h.slice(0, 8) + "-" + h.slice(8, 12) + "-" + h.slice(12, 16) + "-" + h.slice(16, 20) + "-" + h.slice(20);
  }

  function slugify(s) {
    return String(s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")
      .slice(0, 40) || "cliente";
  }

  // Chamada ao finalizar o formulário: prepara um novo envio
  // (novo id + nome do arquivo do relatório) e zera as flags de sincronização.
  function hzNovoEnvio(nome) {
    var id = uuid4();
    var arquivo = new Date().toISOString().slice(0, 10) + "_" + slugify(nome) + "_" + id.slice(0, 8) + ".html";
    lsSet(K_ID, id);
    lsSet(K_ARQUIVO, arquivo);
    lsDel(K_SYNC);
    lsDel(K_UPLOAD);
    return { id: id, arquivo: arquivo };
  }

  // Grava as respostas do formulário na tabela `diagnosticos`.
  // Idempotente: reenvia com o mesmo id não duplica (conflito = já enviado).
  // Retorna: "ok" | "ja-enviado" | "nao-configurado" | "sem-dados" | "erro"
  function hzEnviarDiagnostico() {
    var sb = client();
    if (!sb) return Promise.resolve("nao-configurado");
    if (lsGet(K_SYNC) === "ok") return Promise.resolve("ja-enviado");

    var stored = null;
    try { stored = JSON.parse(lsGet(K_DATA) || "null"); } catch (e) {}
    if (!stored || !stored.data) return Promise.resolve("sem-dados");

    var id = lsGet(K_ID);
    var arquivo = lsGet(K_ARQUIVO);
    if (!id) {
      var novo = hzNovoEnvio(stored.data.nome);
      id = novo.id;
      arquivo = novo.arquivo;
    }

    var resumo = {};
    try {
      if (window.HZDiag) {
        var R = window.HZDiag.computeReport(stored.data);
        resumo = { score: R.scoreGeral, nivel: R.nivel.nome, arquetipo: R.arquetipo.nome };
      }
    } catch (e) {}

    var linha = Object.assign({
      id: id,
      nome: stored.data.nome || null,
      email: stored.data.email || null,
      respostas: stored.data,
      relatorio_arquivo: arquivo
    }, resumo);

    return sb.from(TABELA).insert(linha).then(function (res) {
      if (!res.error || res.error.code === "23505") {
        lsSet(K_SYNC, "ok");
        return "ok";
      }
      return "erro";
    }, function () { return "erro"; });
  }

  // Envia um retrato estático da página do relatório (HTML) para o
  // bucket `relatorios` do Storage. Deve ser chamada na página do
  // relatório, depois de renderizado.
  // Retorna: "ok" | "ja-enviado" | "nao-configurado" | "sem-dados" | "erro"
  function hzEnviarRelatorio() {
    var sb = client();
    if (!sb) return Promise.resolve("nao-configurado");
    if (lsGet(K_UPLOAD) === "ok") return Promise.resolve("ja-enviado");

    var arquivo = lsGet(K_ARQUIVO);
    if (!arquivo) return Promise.resolve("sem-dados");

    var clone = document.documentElement.cloneNode(true);
    var scripts = clone.querySelectorAll("script");
    for (var i = 0; i < scripts.length; i++) scripts[i].parentNode.removeChild(scripts[i]);
    var html = "<!DOCTYPE html>\n" + clone.outerHTML;

    return sb.storage.from(BUCKET)
      .upload(arquivo, new Blob([html], { type: "text/html" }), { contentType: "text/html", upsert: false })
      .then(function (res) {
        var jaExiste = res.error && (String(res.error.statusCode) === "409" || /already exists|duplicate/i.test(res.error.message || ""));
        if (!res.error || jaExiste) {
          lsSet(K_UPLOAD, "ok");
          return "ok";
        }
        return "erro";
      }, function () { return "erro"; });
  }

  window.hzSupabase = {
    configurado: configurado,
    novoEnvio: hzNovoEnvio,
    enviarDiagnostico: hzEnviarDiagnostico,
    enviarRelatorio: hzEnviarRelatorio
  };
})();
