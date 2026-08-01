// ─────────────────────────────────────────────────────────────
//  diagnostico-core.js | HZ Invest
//  Lógica de cálculo do Diagnóstico Financeiro (fonte da verdade
//  das regras de negócio), compartilhada entre o formulário
//  (diagnostico.html) e o relatório (diagnostico-relatorio.html).
//  Expõe tudo em window.HZDiag.
// ─────────────────────────────────────────────────────────────
(function () {
  "use strict";

  /* ===================== Premissas de projeção ===================== */
  // Retornos NOMINAIS anuais por classe e por perfil; a projeção converte
  // tudo para retorno REAL (descontada a inflação), de modo que curvas e
  // meta fiquem a preços de hoje. Ajuste os valores aqui se necessário.
  var PREMISSAS = {
    inflacaoAnual: 0.04,
    nominalPorAtivo: { investPoupanca: 0.065, investRendaFixaPublica: 0.105, investRendaFixaPrivada: 0.105, investRendaVariavel: 0.13, investCripto: 0.15, investOutros: 0.09 },
    nominalPorPerfil: { "Conservador": 0.105, "Moderado": 0.115, "Arrojado": 0.13 }
  };
  function taxaReal(nominal) {
    return (1 + nominal) / (1 + PREMISSAS.inflacaoAnual) - 1;
  }

  /* ===================== Textos fixos ===================== */
  var NIVEL_TEXTS = {
    1: { nome: "Ponto de Partida", contexto: "Você está no início da jornada de organização financeira. Os fundamentos ainda precisam ser construídos, um passo de cada vez." },
    2: { nome: "Em Construção", contexto: "Algumas bases já existem, mas ainda há lacunas importantes que pedem atenção antes de avançar para otimização." },
    3: { nome: "Fundação Formada", contexto: "Os fundamentos estão no lugar. Agora é hora de fechar as lacunas que restam e dar direção de longo prazo ao que já foi construído." },
    4: { nome: "Consolidado", contexto: "Sua vida financeira está bem estruturada na maior parte das dimensões. O foco agora é refinar pontos específicos e manter consistência." },
    5: { nome: "Otimizado", contexto: "Você construiu uma relação madura e estruturada com o dinheiro. A partir daqui, o jogo é sofisticação e eficiência, não mais construção de base." }
  };

  var ARCHETYPE_TEXTS = {
    negacao: { nome: "Negação Financeira", abertura: "Você não está sozinho nisso, e o primeiro passo pra sair daqui já foi dado: você chegou até aqui e olhou pros números de frente." },
    ilusao: { nome: "Ilusão de Controle", abertura: "As contas fecham no fim do mês, e isso já é melhor do que boa parte das pessoas. Mas \"fechar as contas\" e \"estar seguro\" são coisas diferentes, e é aí que vale a pena olhar com mais cuidado." },
    adiamento: { nome: "Adiamento do Futuro", abertura: "Você tem disciplina, guarda dinheiro, se vira bem no dia a dia. O que falta não é esforço, é direção." },
    otimismo: { nome: "Otimismo Desprotegido", abertura: "Ninguém gosta de pensar no que pode dar errado, e é exatamente por isso que essa é a área mais adiada por quase todo mundo." },
    paralisia: { nome: "Paralisia da Decisão", abertura: "Você guarda dinheiro, isso já é mais do que a maioria consegue fazer. O problema não é a disciplina, é o próximo passo depois de guardar." },
    vazamento: { nome: "Vazamento Silencioso", abertura: "Suas contas fecham, você não vive no vermelho, mas isso não significa que não haja dinheiro escorrendo pelo ralo todo mês. Só que esse vazamento é silencioso." },
    dominio: { nome: "Domínio Comportamental", abertura: "Você já construiu algo raro: uma relação madura com o dinheiro, não só uma planilha organizada." }
  };

  var ACTION_LIBRARY = {
    fluxo: {
      critico: function (n) { return { texto: "Sua despesa mensal supera sua renda em " + n.deficit + ". Antes de qualquer outra ação, é essencial mapear os 3 maiores gastos variáveis e cortar ou renegociar o que for possível nos próximos 30 dias.", acao: "Listar os 3 maiores gastos variáveis do último mês e definir um corte ou renegociação para cada um." }; },
      insuficiente: function (n) { return { texto: "Sua taxa de poupança está em " + n.taxa + ", abaixo do recomendado (mínimo 10%). Recomendamos revisar a categoria de maior peso no seu orçamento, " + n.categoria + ", que representa " + n.categoriaPct + " da sua renda.", acao: "Revisar os gastos em " + n.categoria + " e buscar reduzir em pelo menos 10% no próximo mês." }; },
      otimizacao: function (n) { return { texto: "Sua taxa de poupança de " + n.taxa + " está saudável. O foco agora é otimizar o destino desse valor guardado, não aumentar o quanto é guardado.", acao: "Revisar se o valor poupado está indo para as aplicações mais adequadas ao seu perfil e objetivos." }; }
    },
    liquidez: {
      critico: function (n) { return { texto: "Sua reserva cobre menos de 1 mês de despesas. Definir um valor mensal fixo, mesmo pequeno, pra construir esse colchão é a prioridade imediata.", acao: "Definir um valor fixo mensal (mesmo que pequeno) e automatizar a transferência para a reserva de emergência." }; },
      insuficiente: function (n) { return { texto: "Você tem " + n.meses + " meses de cobertura, mas o ideal é 6. Mantendo o ritmo atual de poupança, você atinge isso em aproximadamente " + n.mesesParaMeta + " meses.", acao: "Direcionar parte do valor poupado mensalmente para a reserva até atingir 6 meses de cobertura." }; },
      otimizacao: function (n) { return { texto: "Sua reserva está bem dimensionada" + n.aplicacaoNota, acao: n.aplicacaoAcao }; }
    },
    endividamento: {
      critico: function (n) { return { texto: "Suas dívidas somam " + n.totalDividas + " (cerca de " + n.mesesDivida + " meses da sua renda), com parcelas comprometendo " + n.comprometimento + " da renda mensal, nível crítico. Priorizar a quitação da dívida de maior taxa de juros antes de qualquer investimento é essencial.", acao: "Listar todas as dívidas por taxa de juros e priorizar a quitação da mais cara primeiro." }; },
      insuficiente: function (n) { return { texto: "Suas dívidas somam " + n.totalDividas + " e as parcelas comprometem " + n.comprometimento + " da renda mensal, o que pede atenção. Recomendamos consolidar ou renegociar as dívidas de maior taxa.", acao: "Buscar consolidação ou renegociação das dívidas de maior taxa de juros." }; },
      otimizacao: function (n) { return { texto: "Sem dívidas problemáticas no momento. Sua saúde de endividamento está excelente.", acao: "Manter o hábito de evitar crédito rotativo e cheque especial." }; }
    },
    risco: {
      critico: function (n) { return { texto: "Sua proteção contra imprevistos tem lacunas sérias: " + n.protecaoLista + ". Isso expõe " + (n.dependentes > 0 ? "sua família" : "você") + " a risco financeiro significativo em caso de imprevisto.", acao: n.protecaoAcao }; },
      insuficiente: function (n) { return { texto: "Sua proteção cobre parte dos cenários, mas ainda há lacunas: " + n.protecaoLista + ".", acao: n.protecaoAcao }; },
      otimizacao: function (n) { return { texto: "Sua proteção está bem estruturada. Recomendamos revisão periódica a cada 2 anos para manter a adequação.", acao: "Agendar uma revisão de apólices em até 2 anos." }; }
    },
    patrimonio: {
      critico: function (n) { return { texto: "Seu patrimônio atual representa " + n.indice + " do esperado pra sua idade e renda. Isso não reflete falta de capacidade, reflete falta de estrutura de investimento, o que é resolvível.", acao: "Estruturar um plano de aportes mensais recorrentes em investimentos alinhados ao seu perfil de risco." }; },
      insuficiente: function (n) { return { texto: "Você está próximo do patrimônio esperado, mas " + n.gapDesc + ".", acao: "Revisar a composição da carteira para reduzir a concentração ou realinhar ao perfil de risco declarado." }; },
      otimizacao: function (n) { return { texto: "Seu patrimônio está bem posicionado frente ao esperado. O foco agora é eficiência: custos, diversificação e adequação fina ao perfil.", acao: "Revisar custos e diversificação da carteira atual anualmente." }; }
    },
    metas: {
      critico: function (n) {
        if (n.aposentado) return { texto: "Pela idade-alvo informada, você já está no período de aposentadoria, e seu patrimônio investido cobre " + n.progresso + " do necessário pela regra dos 25x pra sustentar o gasto desejado.", acao: "Revisar o gasto mensal sustentável com base no patrimônio atual, junto com a estratégia de renda." };
        if (n.metasVagas) return { texto: "Você ainda não tem metas com prazo e valor definidos. Isso torna qualquer estratégia de investimento genérica, sem direção clara.", acao: "Definir 2-3 metas prioritárias com prazo e valor específicos nos próximos 30 dias." };
        return { texto: "Suas metas têm prazo e valor definidos, mas o patrimônio investido cobre só " + n.progresso + " do necessário. O ritmo atual de aportes ainda não sustenta o plano.", acao: n.aporteViavel ? "Estruturar um aporte mensal de " + n.aporte + " direcionado à meta de aposentadoria." : "Revisar valor e prazo da meta de aposentadoria pra chegar num plano de aportes realista." };
      },
      insuficiente: function (n) {
        if (n.aposentado) return { texto: "Pela idade-alvo informada, você já está no período de aposentadoria, e seu patrimônio investido cobre " + n.progresso + " do necessário pela regra dos 25x pra sustentar o gasto desejado.", acao: "Revisar o gasto mensal sustentável com base no patrimônio atual, junto com a estratégia de renda." };
        if (!n.aporteViavel) return { texto: "Seu progresso pra aposentadoria está em " + n.progresso + ", abaixo do esperado pra sua idade. O aporte mensal necessário pra fechar esse gap no prazo atual (" + n.aporte + ") está acima do que a renda comporta, sinal de que o valor ou o prazo da meta precisam ser recalibrados.", acao: "Revisar valor e prazo da meta de aposentadoria pra chegar num plano de aportes realista." };
        return { texto: "Seu progresso pra aposentadoria está em " + n.progresso + ", abaixo do esperado pra sua idade. Seria necessário um aporte mensal de " + n.aporte + " pra fechar esse gap no prazo desejado.", acao: "Estruturar um aporte mensal de " + n.aporte + " direcionado à meta de aposentadoria." };
      },
      otimizacao: function (n) { return { texto: "Você está no caminho certo pra suas metas. Vale revisar anualmente se os valores e prazos continuam realistas.", acao: "Revisar metas e prazos uma vez por ano." }; }
    }
  };

  var GLOSSARIO = [
    { termo: "Taxa de poupança", definicao: "Percentual da sua renda que sobra depois de pagar todas as despesas do mês. Quanto maior, mais rápido você constrói patrimônio." },
    { termo: "Meses de cobertura", definicao: "Por quantos meses sua reserva de emergência sustentaria seu padrão de vida, caso você perdesse sua renda hoje." },
    { termo: "Comprometimento de renda", definicao: "Percentual da sua renda mensal usado para pagar parcelas de dívidas. Acima de 36% é considerado um sinal de alerta." },
    { termo: "Índice de solvência", definicao: "Proporção do seu patrimônio que é realmente sua (patrimônio líquido) em relação ao patrimônio total, descontando dívidas e financiamentos." },
    { termo: "Cobertura de seguro (múltiplo da renda)", definicao: "Quantas vezes sua renda anual o capital do seu seguro de vida cobriria, caso algo acontecesse com você." },
    { termo: "Patrimônio esperado x real", definicao: "Comparação entre o patrimônio que seria esperado pra sua idade e renda, e o patrimônio que você realmente tem hoje." },
    { termo: "Regra dos 25x", definicao: "Estimativa de quanto patrimônio é necessário pra se aposentar: 25 vezes o gasto anual desejado, permitindo retiradas sustentáveis ao longo do tempo." }
  ];

  /* ===================== Helpers ===================== */
  function fmt(value) {
    var n = Number(value) || 0;
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n);
  }
  function pct(value, digits) {
    var d = digits === undefined ? 0 : digits;
    return (Number(value) || 0).toFixed(d).replace(".", ",") + "%";
  }
  function num1(value) {
    return (Number(value) || 0).toFixed(1).replace(".", ",");
  }
  function esc(s) {
    return String(s === undefined || s === null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }
  function bandInterp(value, edges) {
    var t1 = edges[0], t2 = edges[1], t3 = edges[2];
    if (value < t1) return 0 + Math.max(0, value / t1) * 30;
    if (value < t2) return 30 + ((value - t1) / (t2 - t1)) * 30;
    if (value < t3) return 60 + ((value - t2) / (t3 - t2)) * 25;
    return Math.min(100, 85 + Math.min(1, (value - t3) / (t3 * 0.5 || 1)) * 15);
  }
  function bandLabel(score) {
    if (score < 30) return "critico";
    if (score < 60) return "insuficiente";
    if (score < 85) return "adequado";
    return "excelente";
  }

  /* ===================== Cálculo do relatório (regras de negócio) ===================== */
  // geradoEm (opcional): data ISO em que o diagnóstico foi finalizado. O
  // relatório fica datado do momento da finalização, não da visita à página.
  function computeReport(data, geradoEm) {
    var D = data;
    var primeiroNome = (D.nome || "").split(" ")[0] || D.nome;
    var dataRef = geradoEm ? new Date(geradoEm) : new Date();
    if (isNaN(dataRef.getTime())) dataRef = new Date();

    // ---- Dim 1: Fluxo de Caixa ----
    var rendaTotal = (D.rendaPropria || 0) + (D.temConjuge ? (D.rendaConjuge || 0) : 0) + (D.outrasRendas || []).reduce(function (a, r) { return a + (r.valor || 0); }, 0);
    var despesasCats = D.despesas || {};
    var CAT_LABELS = { alimentacao: "Alimentação", educacao: "Educação", impostos: "Impostos", investimentos: "Investimentos/Poupança", lazer: "Lazer", moradia: "Moradia", presentes: "Presentes/Doações", saude: "Saúde", seguros: "Seguros", servicos: "Serviços", transporte: "Transporte", vestuario: "Vestuário" };
    // O valor aportado em "Investimentos/Poupança" é poupança, não gasto de vida:
    // fica fora da despesa total e, portanto, soma a favor da taxa de poupança.
    var aporteMensal = despesasCats.investimentos || 0;
    var despesaTotal = Object.keys(despesasCats).reduce(function (a, k) { return a + (despesasCats[k] || 0); }, 0) - aporteMensal;
    var taxaPoupanca = rendaTotal > 0 ? ((rendaTotal - despesaTotal) / rendaTotal) * 100 : 0;
    var deficit = despesaTotal > rendaTotal;
    var maiorCatKey = null, maiorCatVal = -1;
    Object.keys(despesasCats).forEach(function (k) { if (k === "investimentos") return; if ((despesasCats[k] || 0) > maiorCatVal) { maiorCatVal = despesasCats[k]; maiorCatKey = k; } });
    var scoreFluxo = deficit ? 0 : (taxaPoupanca < 0 ? 0 : taxaPoupanca < 10 ? 30 + (taxaPoupanca / 10) * 30 : taxaPoupanca < 20 ? 60 + ((taxaPoupanca - 10) / 10) * 25 : Math.min(100, 85 + Math.min(1, (taxaPoupanca - 20) / 20) * 15));

    // ---- Dim 2: Liquidez ----
    var mesesCobertura = despesaTotal > 0 ? (D.reservaEmergencia || 0) / despesaTotal : 0;
    var scoreLiquidez = bandInterp(mesesCobertura, [1, 3, 6]);
    var aplicacaoAdequada = ["CDB liquidez diária", "Tesouro Selic"].indexOf(D.ondeAplicada) !== -1;

    // ---- Dim 3: Endividamento ----
    var totalDividas = D.temDividas ? (D.cartaoCredito || 0) + (D.chequeEspecial || 0) + (D.emprestimoPessoal || 0) + (D.outrasDividas || []).reduce(function (a, x) { return a + (x.valor || 0); }, 0) : 0;
    var comprometimento = rendaTotal > 0 ? ((D.parcelasMensais || 0) / rendaTotal) * 100 : 0;
    var scoreEndiv;
    if (!D.temDividas) scoreEndiv = 100;
    else if (comprometimento <= 10) scoreEndiv = 100 - (comprometimento / 10) * 15;
    else if (comprometimento <= 20) scoreEndiv = 85 - ((comprometimento - 10) / 10) * 25;
    else if (comprometimento <= 36) scoreEndiv = 60 - ((comprometimento - 20) / 16) * 30;
    else scoreEndiv = Math.max(0, 30 - ((comprometimento - 36) / 20) * 30);
    // O estoque de dívida também pesa: dívida grande não pode se esconder atrás
    // de parcelas baixas (ex.: rotativo do cartão sem parcela fixa).
    var mesesDivida = rendaTotal > 0 ? totalDividas / rendaTotal : (totalDividas > 0 ? 12 : 0);
    if (D.temDividas && totalDividas > 0) {
      var scoreEstoque;
      if (mesesDivida <= 0.5) scoreEstoque = 100 - (mesesDivida / 0.5) * 15;
      else if (mesesDivida <= 1.5) scoreEstoque = 85 - ((mesesDivida - 0.5) / 1) * 25;
      else if (mesesDivida <= 4) scoreEstoque = 60 - ((mesesDivida - 1.5) / 2.5) * 30;
      else scoreEstoque = Math.max(0, 30 - ((mesesDivida - 4) / 8) * 30);
      scoreEndiv = Math.min(scoreEndiv, scoreEstoque);
    }

    // ---- Patrimônio (precisa vir antes p/ solvência) ----
    var patrimonioImoveis = (D.imoveis || []).reduce(function (a, i) { return a + (i.valorMercado || 0); }, 0);
    var patrimonioVeiculos = (D.veiculos || []).reduce(function (a, i) { return a + (i.valor || 0); }, 0);
    var INVEST_KEYS = ["investPoupanca", "investRendaFixaPublica", "investRendaFixaPrivada", "investRendaVariavel", "investCripto", "investOutros"];
    var patrimonioInvest = INVEST_KEYS.reduce(function (a, k) { return a + (D[k] || 0); }, 0);
    var patrimonioTotal = patrimonioImoveis + patrimonioVeiculos + patrimonioInvest;
    var saldosFinanciamento = (D.imoveis || []).concat(D.veiculos || []).reduce(function (a, i) { return a + (i.status === "financiado" ? (i.saldoDevedor || 0) : 0); }, 0);
    var patrimonioLiquido = patrimonioTotal - saldosFinanciamento - totalDividas;
    var indiceSolvencia = patrimonioTotal > 0 ? (patrimonioLiquido / patrimonioTotal) * 100 : 100;

    // ---- Dim 4: Gestão de Risco ----
    var rendaAnual = rendaTotal * 12;
    // O seguro de vida cobre a perda da renda do titular, então o benchmark
    // usa a renda própria (não a do casal); household só como fallback.
    var rendaSeguroAnual = (D.rendaPropria || 0) > 0 ? (D.rendaPropria || 0) * 12 : rendaAnual;
    var multiploCobertura = rendaSeguroAnual > 0 ? (D.capitalSegurado || 0) / rendaSeguroAnual : 0;
    var dependentes = Number(D.filhos) || 0;
    var benchmarkMultiplo = dependentes === 0 ? 4 : dependentes <= 2 ? 6.5 : 9;
    var scoreRisco1;
    if (!D.temSeguroVida && dependentes > 0) scoreRisco1 = 5;
    else if (!D.temSeguroVida && dependentes === 0) scoreRisco1 = 60; // sem dependentes, seguro de vida é opcional
    else scoreRisco1 = bandInterp(multiploCobertura, [benchmarkMultiplo * 0.5, benchmarkMultiplo * 0.85, benchmarkMultiplo * 1.15]);
    var DURACAO_SCORE = { "Nenhum tempo": 5, "Menos de 3 meses": 30, "3-6 meses": 68, "6+ meses ou tenho seguro invalidez": 92 };
    var scoreRisco2 = DURACAO_SCORE[D.tempoRendaGarantida] !== undefined ? DURACAO_SCORE[D.tempoRendaGarantida] : 40;
    // Proteção de saúde: plano de saúde e/ou reserva médica dedicada
    var scoreRisco3 = D.temPlanoSaude ? (D.reservaMedica ? 100 : 80) : (D.reservaMedica ? 45 : 10);
    var scoreRisco = scoreRisco1 * 0.4 + scoreRisco2 * 0.35 + scoreRisco3 * 0.25;

    // ---- Dim 5: Patrimônio ----
    var idade = Number(D.idade) || 30;
    var patrimonioEsperado = (idade * rendaAnual) / 10;
    var indicePatrimonio = patrimonioEsperado > 0 ? (patrimonioTotal / patrimonioEsperado) * 100 : 100;
    var scorePatrimonio = bandInterp(indicePatrimonio, [50, 100, 150]);
    // Ajuste fino comportamental: conhecer a rentabilidade da própria carteira
    // e investir de forma automática são preditores de acúmulo consistente.
    var AJUSTE_CONHECIMENTO = { "Não sei": -4, "Ideia vaga": -2, "Sei aproximado": 1, "Sei exato": 3 };
    var AJUSTE_AUTOMATICO = { "Só o que sobra": -4, "Às vezes automático": -1, "Quase sempre": 2, "Sempre automático": 4 };
    scorePatrimonio = Math.max(0, Math.min(100, scorePatrimonio + (AJUSTE_CONHECIMENTO[D.sabeRentabilidade] || 0) + (AJUSTE_AUTOMATICO[D.investeAutomatico] || 0)));
    var concentracaoMax = patrimonioInvest > 0 ? Math.max.apply(null, INVEST_KEYS.map(function (k) { return D[k] || 0; })) / patrimonioInvest * 100 : 0;
    var rvPct = patrimonioInvest > 0 ? (((D.investRendaVariavel || 0) + (D.investCripto || 0)) / patrimonioInvest) * 100 : 0;
    var perfilAlertText = null;
    if (patrimonioInvest > 0) {
      if (D.perfilRisco === "Conservador" && rvPct > 30) perfilAlertText = "alocação em renda variável (" + pct(rvPct) + ") acima do que seu perfil conservador costuma sugerir";
      else if (D.perfilRisco === "Moderado" && rvPct > 65) perfilAlertText = "alocação em renda variável (" + pct(rvPct) + ") bem acima do que um perfil moderado costuma sugerir";
      else if (D.perfilRisco === "Arrojado" && rvPct < 15) perfilAlertText = "apenas " + pct(rvPct) + " em renda variável para um perfil arrojado, possível ineficiência de alocação";
    }

    // ---- Dim 6: Metas ----
    var gastoMensalAposentadoria = D.gastoNaoSei ? rendaTotal * ((D.gastoPercent || 70) / 100) : (D.gastoMensalAposentadoria || 0);
    var patrimonioNecessario = gastoMensalAposentadoria * 12 * 25;
    // A reserva de emergência tem função própria (imprevistos) e fica fora
    // dos ativos destinados à aposentadoria, evitando contar duas vezes.
    var ativosLiquidos = Math.max(0, patrimonioInvest - (D.reservaEmergencia || 0));
    var idadeAposentadoria = Number(D.idadeAposentadoria) || idade + 20;
    var progressoAtual = patrimonioNecessario > 0 ? (ativosLiquidos / patrimonioNecessario) * 100 : 0;
    var anosParaAposentar = Math.max(1, idadeAposentadoria - idade);
    // Quem já atingiu (ou passou) a idade-alvo é avaliado pelo progresso absoluto
    // frente à regra dos 25x, não pela curva de acúmulo esperada por idade.
    var aposentadoriaAtingida = idadeAposentadoria <= idade;
    var expectedProgress = Math.max(5, Math.min(95, ((idade - 25) / Math.max(1, (idadeAposentadoria - 25))) * 100));
    var progressoRelativo = aposentadoriaAtingida ? progressoAtual : (expectedProgress > 0 ? (progressoAtual / expectedProgress) * 100 : progressoAtual);
    var scoreMetas = ativosLiquidos <= 0 ? 5 : bandInterp(progressoRelativo, [50, 100, 150]);
    // Já ter calculado quanto guardar por mês é sinal de planejamento ativo.
    var AJUSTE_CALCULO = { "Não": -4, "Pensei mas não calculei": -2, "Calculei aproximado": 1, "Calculei exato": 3 };
    scoreMetas = Math.max(0, Math.min(100, scoreMetas + (AJUSTE_CALCULO[D.calculouQuantoGuardar] || 0)));

    // ---- Score geral ----
    var WEIGHTS = { fluxo: 0.20, liquidez: 0.15, endividamento: 0.20, risco: 0.15, patrimonio: 0.20, metas: 0.10 };
    var scores = { fluxo: scoreFluxo, liquidez: scoreLiquidez, endividamento: scoreEndiv, risco: scoreRisco, patrimonio: scorePatrimonio, metas: scoreMetas };
    var scoreGeral = Math.round(Object.keys(WEIGHTS).reduce(function (a, k) { return a + scores[k] * WEIGHTS[k]; }, 0));
    var nivelN = scoreGeral <= 20 ? 1 : scoreGeral <= 40 ? 2 : scoreGeral <= 60 ? 3 : scoreGeral <= 80 ? 4 : 5;
    var nivel = Object.assign({ n: nivelN }, NIVEL_TEXTS[nivelN]);

    // ---- Arquétipo ----
    var dimScoreList = [
      { key: "fluxo", nome: "Fluxo de Caixa", score: scoreFluxo },
      { key: "liquidez", nome: "Liquidez", score: scoreLiquidez },
      { key: "endividamento", nome: "Endividamento", score: scoreEndiv },
      { key: "risco", nome: "Gestão de Risco", score: scoreRisco },
      { key: "patrimonio", nome: "Patrimônio", score: scorePatrimonio },
      { key: "metas", nome: "Metas e Planejamento", score: scoreMetas }
    ];
    var weakest = dimScoreList.reduce(function (a, b) { return b.score < a.score ? b : a; });
    var archetypeId;
    if (deficit) archetypeId = "negacao";
    else if (scoreGeral < 40) archetypeId = "ilusao";
    // Se até a dimensão mais fraca está em faixa adequada (>= 60, mesma régua do
    // plano de ação), o padrão é de domínio. Sem esse piso, um cliente excelente
    // em tudo receberia o arquétipo da sua "pior" dimensão mesmo ela estando ótima.
    else if (weakest.score >= 60) archetypeId = "dominio";
    else if (weakest.key === "fluxo") archetypeId = "ilusao";
    else if (weakest.key === "metas") archetypeId = "adiamento";
    else if (weakest.key === "risco") archetypeId = "otimismo";
    else if (weakest.key === "patrimonio") archetypeId = "paralisia";
    else if (weakest.key === "liquidez") archetypeId = "ilusao";
    else if (weakest.key === "endividamento") archetypeId = "vazamento";
    else archetypeId = "adiamento";
    var archBase = ARCHETYPE_TEXTS[archetypeId];

    var rendaBand = rendaTotal < 8000 ? "inicial" : rendaTotal <= 20000 ? "média" : "alta";

    // Fatos reais do cliente que condicionam os textos do arquétipo:
    // nenhum texto pode afirmar algo que as respostas contradizem.
    var metasVagas = D.temMetasDefinidas === "Não tenho metas" || D.temMetasDefinidas === "Ideias vagas" || !D.temMetasDefinidas;
    var protecaoAtiva = !!(D.temSeguroVida && D.temPlanoSaude);
    var taxaSaudavel = taxaPoupanca >= 10;

    var ARCH_PADRAO = {
      negacao: "Hoje, mais dinheiro sai do que entra (déficit de " + fmt(despesaTotal - rendaTotal) + "/mês). Isso não é sobre falta de esforço ou de renda, na maioria das vezes é sobre um padrão de evitar olhar pro extrato e deixar o piloto automático decidir por você.",
      ilusao: "Você não está no vermelho, mas também não tem margem real: sua taxa de poupança é de " + pct(taxaPoupanca) + " e sua reserva cobre " + num1(mesesCobertura) + " meses. Esse tipo de estabilidade é frágil por natureza.",
      adiamento: (taxaSaudavel
        ? "Sua taxa de poupança de " + pct(taxaPoupanca) + " mostra disciplina real."
        : "Suas contas fecham no azul, com taxa de poupança de " + pct(taxaPoupanca) + ".") +
        " Mas seu progresso pra aposentadoria está em " + pct(progressoAtual, 1) + " do patrimônio necessário" +
        (metasVagas ? ", e suas metas ainda são ideias vagas, sem prazo ou valor definidos." : ", abaixo do ritmo que as metas que você definiu pedem."),
      otimismo: (dependentes > 0
        ? "Sua cobertura de seguro de vida é de " + num1(multiploCobertura) + "x sua renda anual, com " + dependentes + " dependente(s), abaixo do recomendado (" + String(benchmarkMultiplo).replace(".", ",") + "x)."
        : "Sua proteção contra imprevistos está incompleta" + (D.temPlanoSaude ? "" : ", a começar pela ausência de plano de saúde") + ", e sua renda ficaria garantida por pouco tempo se algo acontecesse.") +
        " Existe um viés bem humano por trás disso: a crença de que imprevistos graves acontecem com os outros, não com a gente.",
      paralisia: "Você guarda dinheiro, isso já é mais do que a maioria consegue fazer. Mas seu patrimônio representa " + pct(indicePatrimonio) + " do esperado pra sua idade e renda. O problema não é a disciplina, é o próximo passo depois de guardar.",
      vazamento: "Suas contas fecham (taxa de poupança de " + pct(taxaPoupanca) + "), mas " + pct(comprometimento) + " da sua renda mensal está comprometida com dívidas" + (D.sabeTaxaJuros === "Não sei" ? ", e você nem sabe a que taxa de juros" : "") + ". Esse é o tipo de vazamento que não aparece como problema óbvio no orçamento, mas consome silenciosamente sua capacidade de construir patrimônio.",
      dominio: "Reserva, proteção, planejamento e investimento já estão no lugar: score geral de " + scoreGeral + ". Isso não é sorte, é hábito e comportamento construídos ao longo do tempo."
    };
    var ARCH_NAO_OUTRO = {
      negacao: "Diferente de quem só precisa de ajuste fino, aqui o problema é estrutural: com déficit mensal, nenhuma outra dimensão pode ser resolvida de forma sustentável antes desta.",
      ilusao: (D.temDividas
        ? "Mesmo com dívidas em aberto, o ponto central aqui não é o endividamento em si, e sim a ausência de margem e de estrutura de segurança: reserva, proteção e investimento ainda não existem de forma consistente."
        : "Diferente de quem está endividado (você não tem dívidas em aberto) ou sem direção de longo prazo, o que te diferencia aqui é a ausência de qualquer estrutura de segurança: reserva, proteção e investimento ainda não existem de forma consistente."),
      adiamento: "Diferente de quem enfrenta um rombo mensal (você poupa " + pct(taxaPoupanca) + " da renda)" +
        (protecaoAtiva ? " ou de quem não tem proteção básica (seu seguro e plano de saúde estão ativos)" : "") +
        ", o que te diferencia é " +
        (metasVagas
          ? "a ausência de metas com prazo e valor definidos: o dinheiro é guardado, mas sem destino claro."
          : "a distância entre o ritmo atual de acúmulo e o que suas metas pedem: o dinheiro é guardado, mas ainda não no volume necessário."),
      otimismo: "Diferente de quem tem problema de disciplina de poupança (sua taxa de poupança de " + pct(taxaPoupanca) + " é saudável), o gap está especificamente na proteção contra imprevistos.",
      paralisia: (taxaSaudavel
        ? "Diferente de quem não consegue guardar dinheiro, sua taxa de poupança de " + pct(taxaPoupanca) + " mostra disciplina. O gap está em transformar essa disciplina em patrimônio de fato investido."
        : "Diferente de quem não consegue fechar as contas no azul, seu fluxo está sob controle. O gap está em transformar o que você já acumulou em patrimônio de fato investido."),
      vazamento: "Diferente de quem está no vermelho (suas contas fecham, com taxa de poupança de " + pct(taxaPoupanca) + ") ou sem direção de longo prazo, o que te diferencia aqui é uma dívida cara ativa consumindo recursos que poderiam estar rendendo. O problema não é falta de renda ou disciplina, e sim uma prioridade de quitação que ainda não foi resolvida.",
      dominio: "Todas as 6 dimensões avaliadas estão em faixa adequada ou excelente, o que é raro: o foco deixa de ser corrigir e passa a ser otimizar."
    };
    var CTA_BY_BAND = {
      negacao: { inicial: "Plano de 12 meses, com foco total nos primeiros 3 meses em estancar o rombo e construir o primeiro colchão de segurança.", "média": "Plano de 12 meses, com foco total nos primeiros 3 meses em estancar o rombo e construir o primeiro colchão de segurança.", alta: "Mesmo com renda alta, esse padrão pede um plano de 12 meses. Reorganização de hábito muda mais devagar do que reorganização de planilha." },
      ilusao: { inicial: "Plano de 12 meses, começando pela reserva de emergência como base de tudo o resto.", "média": "Plano de 12 meses, começando pela reserva de emergência como base de tudo o resto.", alta: "Plano de 6 meses. O problema aqui não é falta de recurso, é falta de estrutura. Resolve mais rápido." },
      adiamento: { inicial: "Plano de 6 meses focado em estruturar as 2-3 metas prioritárias com prazo e valor claros.", "média": "Plano de 6 meses focado em estruturar as 2-3 metas prioritárias com prazo e valor claros.", alta: "Plano de 3-6 meses. O recurso já existe, falta só a rota. Ajuste rápido e de alto impacto." },
      otimismo: { inicial: "Plano de 6 meses com revisão de proteção básica (seguro de vida, saúde) como prioridade nº1.", "média": "Plano de 6 meses com revisão de proteção básica (seguro de vida, saúde) como prioridade nº1.", alta: "Plano de 3-6 meses. Quanto maior o patrimônio, maior o custo de não estar protegido." },
      paralisia: { inicial: "Plano de 6 meses pra estruturar os primeiros investimentos com segurança e clareza.", "média": "Plano de 6 meses pra estruturar os primeiros investimentos com segurança e clareza.", alta: "Plano de 3 meses. O capital já está disponível, o que falta é a estrutura certa." },
      vazamento: { inicial: "Plano de 6 meses focado em eliminar a dívida mais cara e redirecionar esse valor para construção de patrimônio.", "média": "Plano de 6 meses focado em eliminar a dívida mais cara e redirecionar esse valor para construção de patrimônio.", alta: "Plano de 3-6 meses. Com renda alta, quitar a dívida cara é rápido, o ajuste é mais de prioridade do que de recurso." },
      dominio: { inicial: "Plano de 3 meses de otimização e ajuste fino.", "média": "Plano de 3 meses de otimização e ajuste fino.", alta: "Plano de 3 meses focado em sofisticação: estruturas avançadas, diversificação internacional, planejamento sucessório." }
    };
    var arquetipo = { nome: archBase.nome, abertura: archBase.abertura, padrao: ARCH_PADRAO[archetypeId], naoOutro: ARCH_NAO_OUTRO[archetypeId], prioridade: CTA_BY_BAND[archetypeId][rendaBand] };

    // ---- Plano de ação (ordem fixa de prioridade) ----
    var PRIORITY_ORDER = ["fluxo", "liquidez", "endividamento", "risco", "patrimonio", "metas"];
    var DIM_NAMES = { fluxo: "Fluxo de Caixa e Orçamento", liquidez: "Liquidez e Reserva", endividamento: "Endividamento", risco: "Gestão de Risco (Seguros)", patrimonio: "Patrimônio e Investimentos", metas: "Metas e Planejamento" };
    var gapCobertura = Math.max(0, benchmarkMultiplo - multiploCobertura) * rendaSeguroAnual;
    var aporteNecessario = (function () {
      // taxa real (meta a preços de hoje → desconta a inflação do retorno)
      var rAnual = taxaReal(PREMISSAS.nominalPorPerfil[D.perfilRisco] || PREMISSAS.nominalPorPerfil["Moderado"]);
      var rMensal = Math.pow(1 + rAnual, 1 / 12) - 1;
      var nMeses = anosParaAposentar * 12;
      var fatorFV = Math.pow(1 + rMensal, nMeses);
      var numerador = patrimonioNecessario - ativosLiquidos * fatorFV;
      var denominador = (fatorFV - 1) / rMensal;
      return Math.max(0, numerador / denominador);
    })();

    // Lacunas de proteção (usadas nos textos da dimensão de risco)
    var protecaoGaps = [];
    if (dependentes > 0 && !D.temSeguroVida) protecaoGaps.push("nenhum seguro de vida com " + dependentes + " dependente(s)");
    else if (D.temSeguroVida && multiploCobertura < benchmarkMultiplo * 0.85) protecaoGaps.push("cobertura de seguro de vida de " + num1(multiploCobertura) + "x a renda anual, abaixo do recomendado (" + String(benchmarkMultiplo).replace(".", ",") + "x)");
    if (!D.temPlanoSaude) protecaoGaps.push(D.reservaMedica ? "sem plano de saúde (compensado em parte pela reserva médica)" : "sem plano de saúde nem reserva pra emergências médicas");
    if (D.tempoRendaGarantida === "Nenhum tempo" || D.tempoRendaGarantida === "Menos de 3 meses") protecaoGaps.push("renda garantida por pouco tempo em caso de incapacidade de trabalhar");
    var protecaoAcao =
      (dependentes > 0 && !D.temSeguroVida) ? "Cotar um seguro de vida compatível com o número de dependentes nos próximos 30 dias." :
      (D.temSeguroVida && multiploCobertura < benchmarkMultiplo * 0.85) ? "Revisar o capital segurado do seguro de vida para fechar o gap identificado." :
      (!D.temPlanoSaude) ? "Cotar um plano de saúde ou estruturar uma reserva dedicada a emergências médicas." :
      "Estruturar proteção de renda (seguro de invalidez ou reserva estendida) para imprevistos longos.";

    var N = {
      deficit: fmt(despesaTotal - rendaTotal),
      taxa: pct(taxaPoupanca),
      categoria: CAT_LABELS[maiorCatKey] || "—",
      categoriaPct: rendaTotal > 0 ? pct((maiorCatVal / rendaTotal) * 100) : "0%",
      meses: num1(mesesCobertura),
      mesesParaMeta: taxaPoupanca > 0 ? Math.ceil(((6 - mesesCobertura) * despesaTotal) / ((taxaPoupanca / 100) * rendaTotal || 1)) : "—",
      aplicacaoNota: aplicacaoAdequada ? ", e bem aplicada." : ", mas vale revisar se está na aplicação mais eficiente.",
      aplicacaoAcao: aplicacaoAdequada ? "Manter o acompanhamento periódico da reserva." : "Realocar a reserva para um CDB ou Tesouro Selic com liquidez diária.",
      comprometimento: pct(comprometimento),
      dependentes: dependentes,
      multiplo: num1(multiploCobertura),
      benchmark: String(benchmarkMultiplo).replace(".", ","),
      gap: fmt(gapCobertura),
      indice: pct(indicePatrimonio),
      gapDesc: concentracaoMax > 70 ? "concentração excessiva em uma única classe de investimento (" + pct(concentracaoMax) + ")" : perfilAlertText ? perfilAlertText : "vale revisar a diversificação da carteira",
      progresso: pct(progressoAtual, 1),
      aporte: fmt(aporteNecessario),
      totalDividas: fmt(totalDividas),
      mesesDivida: num1(mesesDivida),
      protecaoLista: protecaoGaps.join("; ") || "nenhuma lacuna relevante identificada",
      protecaoAcao: protecaoAcao,
      aporteViavel: aporteNecessario <= rendaTotal * 0.5,
      aposentado: aposentadoriaAtingida,
      metasVagas: metasVagas
    };

    var planEntries = PRIORITY_ORDER.map(function (key) { return { key: key, score: scores[key] }; }).filter(function (e) { return e.score < 60; });
    var strengthEntries = PRIORITY_ORDER.map(function (key) { return { key: key, score: scores[key] }; }).filter(function (e) { return e.score >= 60; });

    var actionPlan = planEntries.map(function (e, i) {
      var fnKey = e.score < 30 ? "critico" : "insuficiente";
      var gen = ACTION_LIBRARY[e.key][fnKey](N);
      return { n: i + 1, dimNome: DIM_NAMES[e.key], texto: gen.texto, acao: gen.acao, key: e.key };
    });
    var strengths = strengthEntries.map(function (e) {
      var gen = ACTION_LIBRARY[e.key].otimizacao(N);
      return { dimNome: DIM_NAMES[e.key], texto: gen.texto, key: e.key };
    });

    // Regra contextual: taxa de juros desconhecida e uso recorrente de rotativo sempre entram na recomendação de endividamento
    if (D.temDividas) {
      var extra = "";
      if (D.sabeTaxaJuros === "Não sei") {
        extra += " Levantar a taxa de juros exata de cada dívida é o primeiro passo. Sem esse dado não é possível priorizar corretamente o que quitar primeiro.";
      }
      if (D.usouRotativo === "Frequentemente" || D.usouRotativo === "Já aconteceu 1-2 vezes") {
        extra += " O uso recorrente de crédito rotativo pra cobrir outra dívida é um sinal de ciclo. Resolver isso é tão prioritário quanto reduzir o valor total da dívida.";
      }
      if (extra) {
        var inPlan = actionPlan.filter(function (a) { return a.key === "endividamento"; })[0];
        var inStrengths = strengths.filter(function (s) { return s.key === "endividamento"; })[0];
        if (inPlan) inPlan.texto += extra;
        else if (inStrengths) inStrengths.texto += extra;
      }
    }

    // Regra contextual: apólices sem revisão há 2+ anos entram na recomendação de risco
    if ((D.temSeguroVida || D.temPlanoSaude) && (D.revisouApolices === "Nunca revisei" || D.revisouApolices === "Faz mais de 2 anos")) {
      var extraRisco = " Suas apólices estão sem revisão há mais de 2 anos. Coberturas desatualizadas costumam ser descobertas na pior hora, então vale agendar uma revisão.";
      var riscoPlan = actionPlan.filter(function (a) { return a.key === "risco"; })[0];
      var riscoStrength = strengths.filter(function (s) { return s.key === "risco"; })[0];
      if (riscoPlan) riscoPlan.texto += extraRisco;
      else if (riscoStrength) riscoStrength.texto += extraRisco;
    }

    // Regra contextual: hábitos de investimento entram na recomendação de patrimônio
    var extraPatrimonio = "";
    if (D.investeAutomatico === "Só o que sobra") {
      extraPatrimonio += " Investir \"só o que sobra\" costuma ser o maior freio de acúmulo. Automatizar o aporte logo após receber a renda muda esse jogo.";
    }
    if (D.sabeRentabilidade === "Não sei") {
      extraPatrimonio += " Vale também passar a acompanhar a rentabilidade da carteira. Sem esse número, não dá pra saber se ela está trabalhando a seu favor.";
    }
    if (extraPatrimonio) {
      var patPlan = actionPlan.filter(function (a) { return a.key === "patrimonio"; })[0];
      var patStrength = strengths.filter(function (s) { return s.key === "patrimonio"; })[0];
      if (patPlan) patPlan.texto += extraPatrimonio;
      else if (patStrength) patStrength.texto += extraPatrimonio;
    }

    // ---- Checklist 30 dias ----
    var checklist = [];
    if (deficit) {
      checklist = [
        "Listar os 3 maiores gastos variáveis do último mês",
        "Cancelar ou renegociar pelo menos 1 assinatura/gasto recorrente",
        "Separar despesas fixas de variáveis num rascunho simples",
        "Definir uma meta de corte de gastos para os próximos 30 dias",
        "Agendar 15 minutos semanais para revisar o extrato"
      ];
    } else {
      checklist = actionPlan.slice(0, 3).map(function (a) { return a.acao; });
      if (scoreMetas < 60 && !N.aposentado) {
        checklist.push(N.aporteViavel
          ? "Simular um aporte mensal de " + N.aporte + " direcionado à meta de aposentadoria."
          : "Revisar valor e prazo da meta de aposentadoria pra chegar num plano de aportes realista.");
      }
      if (checklist.length < 5) checklist.push("Revisar o extrato do último mês e confirmar se os números batem com sua percepção.");
    }
    checklist = checklist.slice(0, 5);

    // ---- Próximo passo ----
    var criticosCount = dimScoreList.filter(function (d) { return d.score < 30; }).length;
    var insuficientesCount = dimScoreList.filter(function (d) { return d.score >= 30 && d.score < 60; }).length;
    var duracaoMeses = 3;
    if (criticosCount >= 2) duracaoMeses = 12;
    else if (criticosCount === 1 || insuficientesCount >= 2) duracaoMeses = 6;
    var ctaMatch = arquetipo.prioridade.match(/(\d+)(?:-(\d+))? mes/);
    var ctaMeses = ctaMatch ? parseInt(ctaMatch[2] || ctaMatch[1], 10) : duracaoMeses;
    var duracaoFinal = Math.max(duracaoMeses, ctaMeses || duracaoMeses);
    var nextStep = {
      duracao: duracaoFinal + " meses",
      justificativa: "Com " + criticosCount + " dimensão(ões) crítica(s) e " + insuficientesCount + " insuficiente(s), somado ao seu perfil comportamental (" + arquetipo.nome + "), um acompanhamento de " + duracaoFinal + " meses é o que permite consolidar mudanças de forma realista, sem pressa nem abandono no meio do caminho."
    };

    // ---- Projeção futura ----
    // Projeção em termos REAIS: retornos nominais das premissas convertidos
    // para acima da inflação, mantendo meta e curvas a preços de hoje.
    var rPerfil = taxaReal(PREMISSAS.nominalPorPerfil[D.perfilRisco] || PREMISSAS.nominalPorPerfil["Moderado"]);
    var rComposicaoReal = patrimonioInvest > 0 ? taxaReal(INVEST_KEYS.reduce(function (a, k) { return a + (D[k] || 0) * (PREMISSAS.nominalPorAtivo[k] || 0.09); }, 0) / patrimonioInvest) : rPerfil;
    var rAnual1 = Math.min(rPerfil, rComposicaoReal);
    var rAnual2 = rPerfil;
    var rMensal1 = Math.pow(1 + rAnual1, 1 / 12) - 1;
    var rMensal2 = Math.pow(1 + rAnual2, 1 / 12) - 1;
    var pmt1 = Math.max(0, (taxaPoupanca / 100) * rendaTotal);
    // O cenário recomendado nunca assume aporte acima de 40% da renda:
    // acima disso a recomendação passa a ser recalibrar a meta, não o aporte.
    var pmt2 = Math.max(pmt1 * 1.2, Math.min(aporteNecessario, rendaTotal * 0.4));
    var fv = function (p0, pmt, n, rMensal) { return p0 * Math.pow(1 + rMensal, n) + pmt * ((Math.pow(1 + rMensal, n) - 1) / rMensal); };
    var months = [0, 12, 24, 36, 48, 60, 72, 84, 96, 108, 120];
    var series1 = months.map(function (n) { return fv(ativosLiquidos, pmt1, n, rMensal1); });
    var series2 = months.map(function (n) { return fv(ativosLiquidos, pmt2, n, rMensal2); });
    // Se a meta for muito maior que as projeções, ela sai da escala do gráfico
    // (linha fixada no topo) pra não achatar as duas curvas no rodapé.
    var maxSeries = Math.max.apply(null, series1.concat(series2));
    var metaForaEscala = patrimonioNecessario > maxSeries * 3;
    var maxVal = Math.max(maxSeries, metaForaEscala ? 0 : patrimonioNecessario) * 1.08;
    var chartW = 600, chartH = 340, padL = 8, padR = 8, padT = 16, padB = 16;
    var xFor = function (i) { return padL + (i / (months.length - 1)) * (chartW - padL - padR); };
    var yFor = function (v) { return chartH - padB - (v / (maxVal || 1)) * (chartH - padT - padB); };
    var points1 = series1.map(function (v, i) { return xFor(i).toFixed(1) + "," + yFor(v).toFixed(1); }).join(" ");
    var points2 = series2.map(function (v, i) { return xFor(i).toFixed(1) + "," + yFor(v).toFixed(1); }).join(" ");
    var dots2 = series2.map(function (v, i) { return { x: xFor(i).toFixed(1), y: yFor(v).toFixed(1) }; });
    var targetY = metaForaEscala ? (padT + 2).toFixed(1) : yFor(patrimonioNecessario).toFixed(1);
    var end1Y = yFor(series1[series1.length - 1]);
    var end2Y = yFor(series2[series2.length - 1]);
    var closeEnds = Math.abs(end1Y - end2Y) < 16;
    var end1YFinal = closeEnds ? end1Y + 13 : end1Y + 5;
    var end2YFinal = closeEnds ? end2Y - 15 : end2Y - 16;
    var pctX = function (x) { return ((x / chartW) * 100).toFixed(1); };
    var pctY = function (y) { return ((y / chartH) * 100).toFixed(1); };
    var targetLabelY = metaForaEscala ? parseFloat(targetY) + 8 : parseFloat(targetY) - 22;
    var targetLabel = "Meta: " + fmt(patrimonioNecessario) + (metaForaEscala ? " (acima da escala do gráfico)" : "");
    var targetLabelStyle = "left:" + pctX(596) + "%; top:" + pctY(targetLabelY) + "%; transform: translateX(-100%); white-space: nowrap;";
    var end1Style = "left:" + pctX(596) + "%; top:" + pctY(end1YFinal) + "%; transform: translateX(-100%);";
    var end2Style = "left:" + pctX(596) + "%; top:" + pctY(end2YFinal) + "%; transform: translateX(-100%);";

    // ---- Gauge ----
    var gaugeCirc = 2 * Math.PI * 68;
    var gaugeDash = gaugeCirc.toFixed(1) + " " + gaugeCirc.toFixed(1);
    var gaugeOffset = (gaugeCirc * (1 - scoreGeral / 100)).toFixed(1);

    // ---- KPI cards ----
    var kpiHero = [
      { label: "Renda total mensal", value: fmt(rendaTotal) },
      { label: "Patrimônio líquido", value: fmt(patrimonioLiquido) },
      { label: "Progresso pra aposentadoria", value: pct(progressoAtual, 1) }
    ];
    var kpiRest = [
      { label: "Despesa total mensal", value: fmt(despesaTotal), sub: aporteMensal > 0 ? "+ " + fmt(aporteMensal) + " de aporte em investimentos" : undefined },
      { label: "Taxa de poupança", value: pct(taxaPoupanca), sub: aporteMensal > 0 ? "inclui o aporte mensal declarado" : undefined },
      { label: "Reserva de emergência", value: fmt(D.reservaEmergencia), sub: num1(mesesCobertura) + " meses de cobertura" },
      { label: "Total de dívidas", value: fmt(totalDividas), sub: D.temDividas ? pct(comprometimento) + " da renda em parcelas" : "sem dívidas em aberto" },
      { label: "Patrimônio total", value: fmt(patrimonioTotal) },
      { label: "Patrimônio esperado x real", value: pct(indicePatrimonio) },
      { label: "Cobertura de seguro de vida", value: num1(multiploCobertura) + "x", sub: "da sua renda anual" },
      { label: "Investido para aposentadoria", value: fmt(ativosLiquidos), sub: (D.reservaEmergencia || 0) > 0 ? "não inclui a reserva de emergência" : undefined },
      { label: "Índice de solvência", value: pct(indiceSolvencia) }
    ];

    // Insight comportamental: divergência entre percepção e realidade calculada
    var divergencias = [];
    if (D.salarioCobre === true && deficit) {
      divergencias.push("Você sente que sua renda cobre as despesas, mas o cálculo real mostra um déficit de " + fmt(despesaTotal - rendaTotal) + "/mês. Vale revisar o orçamento com mais atenção.");
    } else if (D.salarioCobre === false && !deficit) {
      divergencias.push("Você sente que a renda não cobre as despesas, mas pelos números reais suas contas fecham (taxa de poupança de " + pct(taxaPoupanca) + "). A sensação de aperto pode vir de falta de clareza sobre para onde o dinheiro vai, não de um problema real de fluxo.");
    }
    if (D.sobraEmpataVermelho === "Sobra" && taxaPoupanca < 5 && !deficit) {
      divergencias.push("Você sente que sobra dinheiro no fim do mês, mas sua taxa de poupança real é de apenas " + pct(taxaPoupanca) + ". Vale confirmar se essa sobra está realmente sendo guardada ou só some sem destino.");
    } else if (D.sobraEmpataVermelho === "Fico no vermelho" && !deficit) {
      divergencias.push("Você sente que fica no vermelho, mas o cálculo mostra que as contas fecham. Pode valer a pena mapear os gastos com mais detalhe pra entender de onde vem essa sensação.");
    }
    if (D.sabeParaOndeVaiDinheiro === "Não, tenho surpresas com frequência") {
      divergencias.push("Você relatou ter surpresas frequentes com os próprios gastos. Mapear categorias com mais detalhe no dia a dia pode trazer bastante clareza sobre para onde o dinheiro está indo.");
    }
    // Segurança percebida (tempo que aguentaria sem renda) × cobertura real da reserva
    var TEMPO_PERCEBIDO_MESES = { "Dias": 0.2, "Semanas": 0.7, "Poucos meses": 3, "6+ meses": 6 };
    var percepcaoMeses = TEMPO_PERCEBIDO_MESES[D.tempoSemRenda];
    if (percepcaoMeses !== undefined && despesaTotal > 0) {
      if (percepcaoMeses >= 3 && mesesCobertura < percepcaoMeses * 0.5) {
        divergencias.push("Você acredita que manteria seu padrão de vida por " + D.tempoSemRenda.toLowerCase() + " sem renda, mas sua reserva cobre " + num1(mesesCobertura) + " meses de despesas. A segurança percebida está maior que a real.");
      } else if (percepcaoMeses <= 0.7 && mesesCobertura >= 3) {
        divergencias.push("Você sente que se desesperaria em " + D.tempoSemRenda.toLowerCase() + " sem renda, mas sua reserva cobre " + num1(mesesCobertura) + " meses de despesas. Você está mais protegido(a) do que imagina.");
      }
    }
    var insightPercepcao = { show: divergencias.length > 0, itens: divergencias.slice(0, 3) };

    // ---- Linhas de dimensão ----
    var DIM_CONTEXT = {
      fluxo: deficit ? "Despesas superam a renda em " + fmt(despesaTotal - rendaTotal) + "/mês." : "Taxa de poupança de " + pct(taxaPoupanca) + (aporteMensal > 0 ? ", incluindo " + fmt(aporteMensal) + " de aporte mensal." : "."),
      liquidez: num1(mesesCobertura) + " meses de despesas cobertos pela reserva.",
      endividamento: D.temDividas ? "Dívidas de " + fmt(totalDividas) + ", com parcelas comprometendo " + pct(comprometimento) + " da renda mensal." : "Sem dívidas em aberto no momento.",
      risco: "Cobertura de seguro de " + num1(multiploCobertura) + "x a renda anual, " + dependentes + " dependente(s), " + (D.temPlanoSaude ? "com" : "sem") + " plano de saúde.",
      patrimonio: "Patrimônio em " + pct(indicePatrimonio) + " do esperado pra sua idade e renda.",
      metas: "Progresso de " + pct(progressoAtual, 1) + " rumo ao patrimônio necessário pra aposentadoria (sem contar a reserva de emergência)."
    };
    var dimRows = PRIORITY_ORDER.map(function (key) {
      var score = Math.round(scores[key]);
      var band = bandLabel(scores[key]);
      var barColor = band === "critico" ? "#B34747" : band === "insuficiente" ? "#C48A3E" : band === "adequado" ? "#4F8C84" : "#1B1B5C";
      return { nome: DIM_NAMES[key], score: score, contexto: DIM_CONTEXT[key], barStyle: "width:" + Math.max(4, score) + "%; background:" + barColor + ";" };
    });

    // ---- Metas declaradas (aposentadoria + outras metas do formulário) ----
    var metasDeclaradas = [{
      titulo: "Aposentadoria aos " + idadeAposentadoria + " anos",
      detalhe: "gasto desejado de " + fmt(gastoMensalAposentadoria) + "/mês · patrimônio-alvo de " + fmt(patrimonioNecessario) + " (regra dos 25x)"
    }];
    (D.outrasMetas || []).forEach(function (m) {
      if (!m || (!m.descricao && !(m.valorEstimado > 0))) return;
      var det = [];
      if (m.valorEstimado > 0) det.push(fmt(m.valorEstimado));
      if (m.prazo) det.push("prazo: " + m.prazo);
      metasDeclaradas.push({ titulo: m.descricao || "Meta", detalhe: det.join(" · ") });
    });

    // ---- Alternativas seguras e mais rentáveis (CDB 100% CDI, Tesouro Selic) ----
    var poupancaParada = (D.investPoupanca || 0) > 0;
    var reservaMalAplicada = (D.reservaEmergencia || 0) > 0 && !aplicacaoAdequada;
    var investSeguroIntro;
    if (poupancaParada && reservaMalAplicada) {
      investSeguroIntro = "Você tem " + fmt(D.investPoupanca) + " na poupança e sua reserva de emergência está em \"" + (D.ondeAplicada || "—") + "\". Com a mesma segurança (ou maior), esse dinheiro pode render mais:";
    } else if (poupancaParada) {
      investSeguroIntro = "Você tem " + fmt(D.investPoupanca) + " na poupança. Com a mesma segurança e liquidez, esse dinheiro pode render mais:";
    } else if (reservaMalAplicada) {
      investSeguroIntro = "Sua reserva de emergência está em \"" + (D.ondeAplicada || "—") + "\". Pra reserva e objetivos de curto prazo, estas alternativas combinam segurança, liquidez e rentabilidade:";
    } else {
      investSeguroIntro = "Pra reserva de emergência e objetivos de curto prazo, estas são as classes de aplicação que combinam segurança, liquidez e rentabilidade:";
    }
    var investSeguro = {
      destaque: poupancaParada || reservaMalAplicada,
      intro: investSeguroIntro,
      itens: [
        { nome: "CDB 100% do CDI (ou mais) com liquidez diária", desc: "Rende consistentemente mais que a poupança, com garantia do FGC de até R$ 250 mil por CPF por instituição e resgate no mesmo dia." },
        { nome: "Tesouro Selic", desc: "Título público federal, a aplicação de menor risco do mercado brasileiro. Acompanha a taxa Selic e permite resgate a qualquer momento sem perda relevante." }
      ],
      nota: "Indicações educacionais de classes de aplicação, não recomendação individualizada de produto."
    };

    return {
      data: Object.assign({}, D, { primeiroNome: primeiroNome }),
      dataFormatada: dataRef.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" }),
      scoreGeral: scoreGeral, nivel: nivel, arquetipo: arquetipo,
      gaugeDash: gaugeDash, gaugeOffset: gaugeOffset,
      kpis: {
        rendaTotalDisplay: fmt(rendaTotal),
        patrimonioTotalDisplay: fmt(patrimonioTotal),
        patrimonioNecessarioDisplay: fmt(patrimonioNecessario),
        projecaoAtualDisplay: fmt(series1[series1.length - 1]),
        projecaoRecomendadaDisplay: fmt(series2[series2.length - 1]),
        taxaRetornoDisplay: pct(rAnual1 * 100, 1) + " (atual) / " + pct(rAnual2 * 100, 1) + " (recomendado)",
        inflacaoDisplay: pct(PREMISSAS.inflacaoAnual * 100, 1)
      },
      kpiHero: kpiHero, kpiRest: kpiRest, dimRows: dimRows, metasDeclaradas: metasDeclaradas,
      chart: { points1: points1, points2: points2, dots2: dots2, targetY: targetY, targetLabel: targetLabel, targetLabelStyle: targetLabelStyle, end1Style: end1Style, end2Style: end2Style },
      actionPlan: actionPlan, hasStrengths: strengths.length > 0, strengths: strengths, investSeguro: investSeguro,
      checklist: checklist, glossario: GLOSSARIO, nextStep: nextStep, insightPercepcao: insightPercepcao,
      vozCliente: { show: !!(D.descricaoSituacao || D.maiorDor || D.sonhos), situacao: D.descricaoSituacao, maiorDor: D.maiorDor, sonhos: D.sonhos },
      contatoMailto: "mailto:elisa@hzinvest.com.br?subject=Diagn%C3%B3stico%20Financeiro%20-%20Pr%C3%B3ximos%20passos"
    };
  }

  var raiz = typeof window !== "undefined" ? window : globalThis;
  raiz.HZDiag = {
    fmt: fmt,
    pct: pct,
    num1: num1,
    esc: esc,
    bandInterp: bandInterp,
    bandLabel: bandLabel,
    computeReport: computeReport,
    GLOSSARIO: GLOSSARIO,
    NIVEL_TEXTS: NIVEL_TEXTS,
    ARCHETYPE_TEXTS: ARCHETYPE_TEXTS
  };
})();
