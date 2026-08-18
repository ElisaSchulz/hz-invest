/* Regras de coerência que todo relatório deveria respeitar, aplicadas a todos
   os perfis de testes/perfis.js. Uso: node testes/coerencia.js */

var t = require("./perfis.js");
var HZDiag = globalThis.HZDiag;

function textoTodo(R) {
  var partes = [R.nivel.contexto, R.arquetipo.abertura, R.arquetipo.padrao, R.arquetipo.naoOutro, R.arquetipo.prioridade];
  R.dimRows.forEach(function (d) { partes.push(d.contexto); });
  R.actionPlan.concat(R.planoOtimizacao || []).forEach(function (a) { partes.push(a.texto); partes.push(a.acao); });
  (R.strengths || []).forEach(function (s) { partes.push(s.texto); });
  (R.checklist || []).forEach(function (c) { partes.push(c); });
  partes.push(R.nextStep.justificativa);
  return partes.join(" \n ");
}

var REGRAS = [
  {
    id: "dominio-sem-dimensao-fraca",
    desc: "O arquétipo Domínio Comportamental afirma que todas as 6 dimensões estão adequadas — então nenhuma pode estar abaixo de 60.",
    check: function (R) {
      if (R.arquetipo.nome !== "Domínio Comportamental") return null;
      var fracas = R.dimRows.filter(function (d) { return d.score < 60; });
      return fracas.length ? "arquétipo de domínio com " + fracas.map(function (d) { return d.nome + "=" + d.score; }).join(", ") : null;
    }
  },
  {
    id: "arquetipo-bate-com-plano",
    desc: "A dimensão que dá nome ao arquétipo deve ser a mesma que abre o plano de ação.",
    check: function (R, p) {
      var MAP = { "Ilusão de Controle": ["fluxo", "liquidez"], "Adiamento do Futuro": ["metas", "patrimonio"], "Otimismo Desprotegido": ["risco"], "Paralisia da Decisão": ["patrimonio"], "Vazamento Silencioso": ["endividamento"], "Negação Financeira": ["fluxo"] };
      var esperadas = MAP[R.arquetipo.nome];
      if (!esperadas || !R.actionPlan.length) return null;
      var primeira = R.actionPlan[0].key;
      return esperadas.indexOf(primeira) === -1
        ? "arquétipo \"" + R.arquetipo.nome + "\" mas o plano começa por " + R.actionPlan[0].dimNome
        : null;
    }
  },
  {
    id: "nivel-nao-elogia-quem-esta-critico",
    desc: "Um nível que afirma estrutura sólida não combina com 2+ dimensões críticas.",
    check: function (R) {
      var criticas = R.dimRows.filter(function (d) { return d.score < 30; });
      return (R.nivel.n >= 3 && criticas.length >= 2)
        ? "Nível " + R.nivel.n + " (" + R.nivel.nome + ") com " + criticas.length + " dimensões críticas: " + criticas.map(function (d) { return d.nome; }).join(", ")
        : null;
    }
  },
  {
    id: "carteira-inexistente",
    desc: "Não citar \"composição atual da sua carteira\" de quem não tem nada investido além da reserva.",
    check: function (R) {
      return (R.valores.ativosLiquidos <= 0 && /composição atual da sua carteira/.test(R.aposentadoria.premissas))
        ? "ativos líquidos = R$ 0, mas as premissas citam a composição da carteira"
        : null;
    }
  },
  {
    id: "aposentado-nao-acumula",
    desc: "Quem já passou da idade-alvo não deve receber ação de acumulação nem de seguro de vida.",
    check: function (R) {
      if (R.aposentadoria.anosAcumulo > 0) return null;
      var ruins = R.actionPlan.filter(function (a) { return /aportes mensais recorrentes|seguro de vida compatível/.test(a.acao); });
      return ruins.length ? "já aposentado, mas o plano pede: " + ruins.map(function (a) { return a.acao; }).join(" | ") : null;
    }
  },
  {
    id: "carteira-para-revisar",
    desc: "Não mandar revisar taxa de administração/diversificação de quem tem menos de 1 renda mensal investida.",
    check: function (R) {
      var texto = textoTodo(R);
      var mira = /taxa de administração de cada aplicação|diversificação da carteira|alocação-alvo por classe/.test(texto);
      return (mira && R.valores.ativosLiquidos < R.valores.rendaTotal)
        ? "manda revisar a carteira, mas os ativos líquidos são " + HZDiag.fmt(R.valores.ativosLiquidos)
        : null;
    }
  },
  {
    id: "lacuna-vs-folga",
    desc: "O relatório não pode listar \"investimento de longo prazo\" como lacuna e, na mesma página, dizer que o plano já está coberto.",
    check: function (R) {
      var texto = textoTodo(R);
      return (/investimento de longo prazo/.test(texto) && /O ponto aqui é folga, não risco/.test(texto))
        ? "diz que falta investimento de longo prazo e que o ponto é folga, não risco"
        : null;
    }
  },
  {
    id: "patrimonio-financiado",
    desc: "O índice de patrimônio deve olhar o patrimônio líquido: financiamento não é riqueza acumulada.",
    check: function (R) {
      var texto = textoTodo(R);
      var liq = R.valores.patrimonioLiquido, tot = R.valores.patrimonioTotal;
      return (tot > 0 && liq / tot < 0.5 && /próximo do patrimônio esperado|acima do esperado/.test(texto))
        ? "patrimônio líquido é " + Math.round(liq / tot * 100) + "% do total, mas o texto trata o patrimônio bruto como acumulado"
        : null;
    }
  },
  {
    id: "aporte-projetado-vs-declarado",
    desc: "A projeção usa a sobra do mês inteiro como aporte; se a pessoa declara investir bem menos, o relatório promete o que ela não faz.",
    check: function (R) {
      var declarado = (R.data.despesas && R.data.despesas.investimentos) || 0;
      var usado = R.valores.aporteAtual;
      return (usado > 0 && declarado > 0 && usado > declarado * 2)
        ? "projeção usa " + HZDiag.fmt(usado) + "/mês de aporte, mas o formulário declara " + HZDiag.fmt(declarado)
        : null;
    }
  },
  {
    id: "reserva-define-a-projecao",
    desc: "Onde a reserva de emergência está aplicada não pode ditar o retorno de décadas de aportes futuros.",
    check: function (R, p) {
      if (R.aposentadoria.anosAcumulo <= 0) return null;
      var alt = JSON.parse(JSON.stringify(p.data));
      var poup = alt.investPoupanca || 0;
      if (poup <= 0 && alt.ondeAplicada !== "Poupança" && alt.ondeAplicada !== "Conta corrente") return null;
      alt.investPoupanca = 0; alt.investRendaFixaPublica = (alt.investRendaFixaPublica || 0) + poup;
      alt.ondeAplicada = "Tesouro Selic";
      var B = HZDiag.computeReport(alt, t.REF);
      var a = R.valores.rendaSustentavelAtual, b = B.valores.rendaSustentavelAtual;
      return (a > 0 && b / a >= 1.5)
        ? "mover a reserva de Poupança pra Tesouro Selic muda a renda projetada de " + HZDiag.fmt(a) + " pra " + HZDiag.fmt(b) + " (" + Math.round(b / a * 100) + "%)"
        : null;
    }
  },
  {
    id: "dependentes-adultos",
    desc: "Cobrar seguro de vida de quem tem filhos já criados: o formulário não distingue dependente de filho adulto.",
    check: function (R) {
      var idade = Number(R.data.idade) || 0;
      var texto = textoTodo(R);
      return (idade >= 60 && Number(R.data.filhos) > 0 && /seguro de vida/.test(texto))
        ? idade + " anos com " + R.data.filhos + " filho(s) e o relatório cobra seguro de vida por dependentes"
        : null;
    }
  }
];

var falhas = 0, total = 0;
console.log("Regras de coerência — " + t.PERFIS.length + " perfis × " + REGRAS.length + " regras\n");
REGRAS.forEach(function (r) {
  var hits = [];
  t.PERFIS.forEach(function (p) {
    total++;
    var msg = r.check(HZDiag.computeReport(p.data, t.REF), p);
    if (msg) hits.push("    " + p.id + ": " + msg);
  });
  falhas += hits.length;
  console.log((hits.length ? "FALHA" : "  ok ") + " · " + r.id);
  console.log("       " + r.desc);
  if (hits.length) console.log(hits.join("\n"));
  console.log("");
});
console.log("Total: " + falhas + " violações em " + total + " verificações.");
process.exitCode = falhas ? 1 : 0;
