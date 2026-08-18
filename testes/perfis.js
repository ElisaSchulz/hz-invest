/* Perfis sintéticos para conferir se o relatório fecha com a história da pessoa.
   Uso: node testes/perfis.js [id-do-perfil]
   Sem argumento, roda todos. */

function base(over) {
  var d = {
    nome: "", email: "teste@exemplo.com", estado: "SP", cidade: "São Paulo", dataNascimento: "",
    estadoCivil: "Solteiro(a)", temConjuge: false, dataNascimentoConjuge: "", filhos: 0, ocupacao: "Serviços",
    rendaPropria: 0, rendaConjuge: 0, outrasRendas: [],
    despesas: { alimentacao: 0, educacao: 0, impostos: 0, investimentos: 0, lazer: 0, moradia: 0, presentes: 0, saude: 0, seguros: 0, servicos: 0, transporte: 0, vestuario: 0 },
    imoveis: [], veiculos: [],
    investPoupanca: 0, investRendaFixaPublica: 0, investRendaFixaPrivada: 0, investRendaVariavel: 0, investCripto: 0, investOutros: 0,
    perfilRisco: "Moderado", sabeRentabilidade: "Ideia vaga", investeAutomatico: "Só o que sobra",
    temDividas: false, cartaoCredito: 0, chequeEspecial: 0, emprestimoPessoal: 0, outrasDividas: [],
    parcelasMensais: 0, sabeTaxaJuros: "", usouRotativo: "",
    reservaEmergencia: 0, ondeAplicada: "Poupança", tempoSemRenda: "Poucos meses",
    temSeguroVida: false, capitalSegurado: 0, temPlanoSaude: false, reservaMedica: false,
    tempoRendaGarantida: "Menos de 3 meses", revisouApolices: "",
    idadeAposentadoria: 65, gastoMensalAposentadoria: 0, gastoNaoSei: false, gastoPercent: 70,
    estrategiaAposentadoria: "renda", idadeFimRenda: "", herancaDesejada: 0,
    temMetasDefinidas: "Ideias vagas", calculouQuantoGuardar: "Não", outrasMetas: [],
    salarioCobre: true, sobraEmpataVermelho: "Empata", sabeParaOndeVaiDinheiro: "Mais ou menos, às vezes me surpreendo",
    descricaoSituacao: "", maiorDor: "", sonhos: "",
    consentimento: true, consentimentoEm: "2026-01-01T00:00:00.000Z"
  };
  Object.keys(over || {}).forEach(function (k) {
    if (k === "despesas") Object.assign(d.despesas, over.despesas);
    else d[k] = over[k];
  });
  return d;
}

// Nascimento que resulta na idade pedida na data de referência do teste.
function nasc(idade) { return (2026 - idade) + "-03-10"; }

var PERFIS = [
  {
    id: "negacao",
    titulo: "Camila, 29 — gasta mais do que ganha",
    historia: "Analista júnior, mora sozinha, cartão estourado todo mês, nenhuma reserva. Sabe que está no vermelho e é a primeira vez que olha os números.",
    esperado: "Arquétipo Negação Financeira. Fluxo zerado, plano de 12 meses, prioridade em estancar o déficit.",
    data: base({
      nome: "Camila Duarte", dataNascimento: nasc(29), ocupacao: "Serviços",
      rendaPropria: 4200,
      despesas: { moradia: 1900, alimentacao: 950, transporte: 500, lazer: 450, saude: 180, servicos: 380, vestuario: 250 },
      temDividas: true, cartaoCredito: 7800, chequeEspecial: 1200, parcelasMensais: 900,
      sabeTaxaJuros: "Não sei", usouRotativo: "Frequentemente",
      reservaEmergencia: 0, ondeAplicada: "Conta corrente", tempoSemRenda: "Dias",
      tempoRendaGarantida: "Nenhum tempo",
      gastoMensalAposentadoria: 5000, temMetasDefinidas: "Não tenho metas", calculouQuantoGuardar: "Não",
      salarioCobre: false, sobraEmpataVermelho: "Fico no vermelho", sabeParaOndeVaiDinheiro: "Não, tenho surpresas com frequência",
      maiorDor: "O cartão de crédito nunca zera."
    })
  },
  {
    id: "ilusao",
    titulo: "Rafael, 34 — contas fecham, mas sem reserva",
    historia: "Professor concursado, casado, sem filhos. Nunca ficou no vermelho, mas nunca sobrou o bastante pra montar reserva. Acha que está tudo sob controle.",
    esperado: "Ilusão de Controle. Liquidez crítica deve puxar o foco; nada de elogio a proteção que não existe.",
    data: base({
      nome: "Rafael Nogueira", dataNascimento: nasc(34), estadoCivil: "Casado(a)", ocupacao: "Educação",
      temConjuge: true, dataNascimentoConjuge: nasc(33), rendaPropria: 6500, rendaConjuge: 3800,
      despesas: { moradia: 3200, alimentacao: 1800, transporte: 900, educacao: 600, lazer: 700, saude: 400, servicos: 600, vestuario: 400, investimentos: 300 },
      reservaEmergencia: 3000, ondeAplicada: "Poupança", tempoSemRenda: "Semanas",
      investPoupanca: 3000,
      temPlanoSaude: true, tempoRendaGarantida: "Menos de 3 meses", revisouApolices: "Nunca revisei",
      gastoMensalAposentadoria: 8000, temMetasDefinidas: "Ideias vagas",
      salarioCobre: true, sobraEmpataVermelho: "Empata",
      maiorDor: "Sinto que nunca sobra pra guardar."
    })
  },
  {
    id: "vazamento",
    titulo: "Patrícia, 41 — poupa, mas carrega dívida cara",
    historia: "Gerente comercial, dois filhos, guarda todo mês. Só que ainda arrasta um empréstimo consignado e o rotativo do cartão de uma reforma.",
    esperado: "Vazamento Silencioso. O plano deve priorizar quitação antes de aporte.",
    data: base({
      nome: "Patrícia Lemos", dataNascimento: nasc(41), estadoCivil: "Casado(a)", ocupacao: "Comércio / Varejo",
      temConjuge: true, dataNascimentoConjuge: nasc(43), filhos: 2,
      rendaPropria: 12000, rendaConjuge: 7000,
      despesas: { moradia: 4500, alimentacao: 2600, transporte: 1400, educacao: 2800, lazer: 900, saude: 700, seguros: 350, servicos: 900, vestuario: 600, investimentos: 1500 },
      temDividas: true, cartaoCredito: 18000, emprestimoPessoal: 42000, parcelasMensais: 3800,
      sabeTaxaJuros: "Ideia vaga", usouRotativo: "Já aconteceu 1-2 vezes",
      reservaEmergencia: 25000, ondeAplicada: "CDB liquidez diária", tempoSemRenda: "Poucos meses",
      investRendaFixaPrivada: 60000, investRendaVariavel: 15000,
      temSeguroVida: true, capitalSegurado: 400000, temPlanoSaude: true, reservaMedica: true,
      tempoRendaGarantida: "3-6 meses", revisouApolices: "Há 1-2 anos",
      gastoMensalAposentadoria: 14000, temMetasDefinidas: "Algumas com prazo/valor", calculouQuantoGuardar: "Calculei aproximado",
      salarioCobre: true, sobraEmpataVermelho: "Sobra",
      maiorDor: "A parcela do empréstimo come o que eu conseguiria investir."
    })
  },
  {
    id: "otimismo",
    titulo: "Bruno, 38 — organizado, mas desprotegido",
    historia: "Dev sênior, casado, dois filhos pequenos, única renda da casa. Investe bem, tem reserva, e nunca contratou seguro de vida.",
    esperado: "Otimismo Desprotegido. Risco deve ser a dimensão crítica; o texto não pode elogiar proteção.",
    data: base({
      nome: "Bruno Sathler", dataNascimento: nasc(38), estadoCivil: "Casado(a)", ocupacao: "Tecnologia",
      temConjuge: true, dataNascimentoConjuge: nasc(36), filhos: 2,
      rendaPropria: 22000, rendaConjuge: 0,
      despesas: { moradia: 5500, alimentacao: 2800, transporte: 1200, educacao: 3200, lazer: 1200, saude: 900, servicos: 900, vestuario: 600, investimentos: 4000 },
      reservaEmergencia: 90000, ondeAplicada: "Tesouro Selic", tempoSemRenda: "6+ meses",
      investRendaFixaPublica: 120000, investRendaFixaPrivada: 90000, investRendaVariavel: 110000,
      perfilRisco: "Arrojado", sabeRentabilidade: "Sei aproximado", investeAutomatico: "Sempre automático",
      temSeguroVida: false, capitalSegurado: 0, temPlanoSaude: false, reservaMedica: false,
      tempoRendaGarantida: "Nenhum tempo",
      gastoMensalAposentadoria: 18000, temMetasDefinidas: "Algumas com prazo/valor", calculouQuantoGuardar: "Calculei aproximado",
      salarioCobre: true, sobraEmpataVermelho: "Sobra",
      maiorDor: "Se acontecer algo comigo, não sei como minha família se sustenta."
    })
  },
  {
    id: "paralisia",
    titulo: "Juliana, 31 — junta dinheiro e deixa na poupança",
    historia: "Dentista autônoma, solteira, sem dívidas. Guarda 25% da renda, mas 100% está na poupança porque tem medo de errar o investimento.",
    esperado: "Paralisia da Decisão. O relatório deve destacar dinheiro parado e as alternativas seguras.",
    data: base({
      nome: "Juliana Prado", dataNascimento: nasc(31), ocupacao: "Saúde",
      rendaPropria: 16000,
      despesas: { moradia: 3800, alimentacao: 1600, transporte: 900, lazer: 900, saude: 500, servicos: 700, vestuario: 500, impostos: 1800, investimentos: 4000 },
      reservaEmergencia: 60000, ondeAplicada: "Poupança", tempoSemRenda: "6+ meses",
      investPoupanca: 190000,
      perfilRisco: "Conservador", sabeRentabilidade: "Não sei", investeAutomatico: "Quase sempre",
      temPlanoSaude: true, reservaMedica: true, tempoRendaGarantida: "3-6 meses", revisouApolices: "Recentemente",
      gastoMensalAposentadoria: 12000, temMetasDefinidas: "Algumas com prazo/valor", calculouQuantoGuardar: "Pensei mas não calculei",
      salarioCobre: true, sobraEmpataVermelho: "Sobra",
      maiorDor: "Tenho medo de investir e perder dinheiro."
    })
  },
  {
    id: "adiamento",
    titulo: "Marcos, 45 — disciplinado, sem rota de longo prazo",
    historia: "Engenheiro CLT, casado, um filho. Investe todo mês, tem reserva e seguro, mas nunca calculou quanto precisa pra aposentar e quer parar aos 60.",
    esperado: "Adiamento do Futuro. Metas deve ser a lacuna, não fluxo nem proteção.",
    data: base({
      nome: "Marcos Vieira", dataNascimento: nasc(45), estadoCivil: "Casado(a)", ocupacao: "Indústria",
      temConjuge: true, dataNascimentoConjuge: nasc(44), filhos: 1,
      rendaPropria: 18000, rendaConjuge: 9000,
      despesas: { moradia: 5200, alimentacao: 2400, transporte: 1600, educacao: 2200, lazer: 1100, saude: 800, seguros: 500, servicos: 900, vestuario: 500, investimentos: 3500 },
      reservaEmergencia: 100000, ondeAplicada: "CDB liquidez diária", tempoSemRenda: "6+ meses",
      investRendaFixaPublica: 150000, investRendaFixaPrivada: 200000, investRendaVariavel: 90000,
      imoveis: [{ valorMercado: 750000, status: "quitado" }],
      temSeguroVida: true, capitalSegurado: 1600000, temPlanoSaude: true, reservaMedica: true,
      tempoRendaGarantida: "6+ meses ou tenho seguro invalidez", revisouApolices: "Há 1-2 anos",
      idadeAposentadoria: 60, gastoMensalAposentadoria: 20000,
      temMetasDefinidas: "Ideias vagas", calculouQuantoGuardar: "Não",
      salarioCobre: true, sobraEmpataVermelho: "Sobra",
      maiorDor: "Não sei se vou conseguir parar de trabalhar aos 60."
    })
  },
  {
    id: "dominio",
    titulo: "Helena, 52 — tudo no lugar",
    historia: "Sócia de escritório, casada, filhos criados. Reserva, seguro, carteira diversificada, metas calculadas. Quer saber se falta algo.",
    esperado: "Domínio Comportamental. Nenhuma dimensão abaixo de adequado; plano de 3 meses de otimização.",
    data: base({
      nome: "Helena Bastos", dataNascimento: nasc(52), estadoCivil: "Casado(a)", ocupacao: "Direito",
      temConjuge: true, dataNascimentoConjuge: nasc(54), filhos: 2,
      rendaPropria: 42000, rendaConjuge: 25000,
      despesas: { moradia: 9000, alimentacao: 4000, transporte: 2500, educacao: 3000, lazer: 3000, saude: 2000, seguros: 1500, servicos: 2000, vestuario: 1500, impostos: 8000, investimentos: 18000 },
      reservaEmergencia: 300000, ondeAplicada: "Tesouro Selic", tempoSemRenda: "6+ meses",
      investRendaFixaPublica: 900000, investRendaFixaPrivada: 800000, investRendaVariavel: 1100000, investOutros: 300000,
      imoveis: [{ valorMercado: 2200000, status: "quitado" }],
      perfilRisco: "Moderado", sabeRentabilidade: "Sei exato", investeAutomatico: "Sempre automático",
      temSeguroVida: true, capitalSegurado: 4000000, temPlanoSaude: true, reservaMedica: true,
      tempoRendaGarantida: "6+ meses ou tenho seguro invalidez", revisouApolices: "Recentemente",
      idadeAposentadoria: 62, gastoMensalAposentadoria: 35000,
      temMetasDefinidas: "Todas com prazo/valor", calculouQuantoGuardar: "Calculei exato",
      salarioCobre: true, sobraEmpataVermelho: "Sobra", sabeParaOndeVaiDinheiro: "Sei bem, sem surpresas",
      sonhos: "Comprar uma casa na serra e trabalhar por escolha, não por necessidade."
    })
  },
  {
    id: "colheita",
    titulo: "Sr. Antônio, 67 — já aposentado",
    historia: "Aposentado do setor público, viúvo, filhos criados. Quer saber quanto pode sacar por mês sem que o dinheiro acabe.",
    esperado: "Fase de Colheita. Sem cobrança de acumulação; foco em saque sustentável.",
    data: base({
      nome: "Antônio Ferraz", dataNascimento: nasc(67), estadoCivil: "Viúvo(a)", ocupacao: "Aposentado(a)",
      filhos: 3, rendaPropria: 9000, outrasRendas: [{ descricao: "Aluguel", valor: 3200 }],
      despesas: { moradia: 2200, alimentacao: 1600, transporte: 700, lazer: 800, saude: 1800, servicos: 700, vestuario: 300 },
      reservaEmergencia: 80000, ondeAplicada: "CDB liquidez diária", tempoSemRenda: "6+ meses",
      investRendaFixaPublica: 400000, investRendaFixaPrivada: 350000, investPoupanca: 50000,
      imoveis: [{ valorMercado: 900000, status: "quitado" }, { valorMercado: 450000, status: "quitado" }],
      perfilRisco: "Conservador", sabeRentabilidade: "Sei aproximado", investeAutomatico: "Às vezes automático",
      temSeguroVida: false, temPlanoSaude: true, reservaMedica: true,
      tempoRendaGarantida: "6+ meses ou tenho seguro invalidez", revisouApolices: "Faz mais de 2 anos",
      idadeAposentadoria: 65, gastoMensalAposentadoria: 11000,
      estrategiaAposentadoria: "consumo", idadeFimRenda: 90, herancaDesejada: 500000,
      temMetasDefinidas: "Algumas com prazo/valor", calculouQuantoGuardar: "Calculei aproximado",
      salarioCobre: true, sobraEmpataVermelho: "Sobra", sabeParaOndeVaiDinheiro: "Sei bem, sem surpresas",
      maiorDor: "Medo de o dinheiro acabar antes de mim."
    })
  },
  {
    id: "jovem-inicio",
    titulo: "Lucas, 23 — primeiro emprego",
    historia: "Estagiário efetivado, mora com os pais, sem dívidas nem reserva. Renda baixa, despesas baixas, nenhum patrimônio.",
    esperado: "Não deve ser tratado como caso grave: sobra dinheiro, o que falta é começar. Checar se o patrimônio esperado pra idade não gera texto absurdo.",
    data: base({
      nome: "Lucas Amorim", dataNascimento: nasc(23), ocupacao: "Tecnologia",
      rendaPropria: 3200,
      despesas: { moradia: 400, alimentacao: 500, transporte: 300, lazer: 400, servicos: 200, vestuario: 200, investimentos: 300 },
      reservaEmergencia: 2500, ondeAplicada: "Poupança", tempoSemRenda: "Poucos meses",
      investPoupanca: 2500,
      perfilRisco: "Arrojado", sabeRentabilidade: "Não sei", investeAutomatico: "Só o que sobra",
      temPlanoSaude: true, tempoRendaGarantida: "Menos de 3 meses",
      gastoMensalAposentadoria: 0, gastoNaoSei: true, gastoPercent: 70,
      temMetasDefinidas: "Ideias vagas", calculouQuantoGuardar: "Não",
      salarioCobre: true, sobraEmpataVermelho: "Sobra",
      sonhos: "Sair da casa dos pais e viajar pra fora."
    })
  },
  {
    id: "renda-alta-endividada",
    titulo: "Fernanda, 47 — renda alta, patrimônio financiado",
    historia: "Médica, divorciada, um filho. Ganha muito, mas tem apartamento e carro financiados e quase nada líquido.",
    esperado: "Patrimônio líquido deve refletir os saldos devedores; comprometimento de renda alto deve pesar no endividamento.",
    data: base({
      nome: "Fernanda Rocha", dataNascimento: nasc(47), estadoCivil: "Divorciado(a)", ocupacao: "Saúde",
      filhos: 1, rendaPropria: 38000,
      despesas: { moradia: 11000, alimentacao: 3000, transporte: 4500, educacao: 4000, lazer: 2500, saude: 1200, seguros: 900, servicos: 1800, vestuario: 1500, impostos: 5000, investimentos: 1500 },
      imoveis: [{ valorMercado: 1800000, status: "financiado", saldoDevedor: 1250000 }],
      veiculos: [{ valor: 320000, status: "financiado", saldoDevedor: 240000 }],
      reservaEmergencia: 40000, ondeAplicada: "CDB liquidez diária", tempoSemRenda: "Poucos meses",
      investRendaFixaPrivada: 40000,
      temDividas: true, cartaoCredito: 25000, parcelasMensais: 15500,
      sabeTaxaJuros: "Ideia vaga", usouRotativo: "Raramente",
      temSeguroVida: true, capitalSegurado: 500000, temPlanoSaude: true, reservaMedica: false,
      tempoRendaGarantida: "Menos de 3 meses", revisouApolices: "Faz mais de 2 anos",
      idadeAposentadoria: 60, gastoMensalAposentadoria: 25000,
      temMetasDefinidas: "Ideias vagas", calculouQuantoGuardar: "Pensei mas não calculei",
      salarioCobre: true, sobraEmpataVermelho: "Empata", sabeParaOndeVaiDinheiro: "Não, tenho surpresas com frequência",
      maiorDor: "Ganho bem e não sobra nada."
    })
  }
];

/* ---------- runner ---------- */
var fs = require("fs");
var path = require("path");
var raiz = path.join(__dirname, "..");
new Function(fs.readFileSync(path.join(raiz, "diagnostico-core.js"), "utf8")).call(globalThis);
var HZDiag = globalThis.HZDiag;
var REF = "2026-06-15T12:00:00.000Z";

function limpa(s) {
  return String(s == null ? "" : s)
    .replace(/<br\s*\/?>/gi, "\n      ")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&#39;/g, "'");
}
function bloco(titulo) { return "\n" + "─".repeat(78) + "\n" + titulo + "\n" + "─".repeat(78); }

function imprime(p) {
  var R = HZDiag.computeReport(p.data, REF);
  var out = [];
  out.push("\n" + "█".repeat(78));
  out.push("PERFIL: " + p.titulo + "  [" + p.id + "]");
  out.push("█".repeat(78));
  out.push("História: " + p.historia);
  out.push("Esperado: " + p.esperado);

  out.push(bloco("RESULTADO"));
  out.push("Score geral: " + R.scoreGeral + "  ·  Nível " + R.nivel.n + " — " + R.nivel.nome);
  out.push("Contexto do nível: " + limpa(R.nivel.contexto));
  out.push("Arquétipo: " + R.arquetipo.nome);
  out.push("Renda " + R.kpis.rendaTotalDisplay + " · Despesa " + HZDiag.fmt(R.valores.despesaTotal) +
    " · Taxa poupança " + HZDiag.pct(R.valores.taxaPoupanca) +
    " · Patrimônio " + R.kpis.patrimonioTotalDisplay + " (líquido " + HZDiag.fmt(R.valores.patrimonioLiquido) + ")");
  out.push("Aporte atual " + R.kpis.aporteAtualDisplay + " · necessário " + R.kpis.aporteNecessarioDisplay +
    " · alvo " + R.kpis.patrimonioNecessarioDisplay + " · renda sustentável " + R.kpis.rendaSustentavelDisplay);

  out.push(bloco("DIMENSÕES"));
  R.dimRows.forEach(function (d) {
    out.push(String(d.score).padStart(3) + " · " + d.nome + "\n      " + limpa(d.contexto));
  });

  out.push(bloco("ARQUÉTIPO"));
  out.push("Abertura: " + limpa(R.arquetipo.abertura));
  out.push("Padrão:   " + limpa(R.arquetipo.padrao));
  out.push("Não é:    " + limpa(R.arquetipo.naoOutro));
  out.push("CTA:      " + limpa(R.arquetipo.prioridade));

  if (R.insightPercepcao.show) {
    out.push(bloco("PERCEPÇÃO vs NÚMEROS"));
    R.insightPercepcao.itens.forEach(function (i) { out.push("• " + limpa(i)); });
  }

  out.push(bloco("KPIs"));
  R.kpiHero.concat(R.kpiRest).forEach(function (k) {
    out.push("• " + limpa(k.label) + ": " + limpa(k.value) + (k.hint ? "\n      " + limpa(k.hint) : ""));
  });

  out.push(bloco("APOSENTADORIA"));
  Object.keys(R.aposentadoria).forEach(function (k) {
    var v = R.aposentadoria[k];
    if (v == null || typeof v === "object") return;
    out.push("• " + k + ": " + limpa(v));
  });

  out.push(bloco("PLANO DE AÇÃO"));
  R.actionPlan.forEach(function (a) {
    out.push(a.n + ") [" + limpa(a.dimNome) + "]");
    out.push("      " + limpa(a.texto));
    out.push("      AÇÃO: " + limpa(a.acao));
  });

  if (R.planoOtimizacao && R.planoOtimizacao.length) {
    out.push(bloco("PLANO DE OTIMIZAÇÃO"));
    R.planoOtimizacao.forEach(function (a) { out.push("• [" + limpa(a.dimNome || "") + "] " + limpa(a.texto || a.titulo || "") + (a.acao ? "\n      AÇÃO: " + limpa(a.acao) : "")); });
  }
  if (R.hasStrengths) {
    out.push(bloco("PONTOS FORTES"));
    R.strengths.forEach(function (s) { out.push("• [" + limpa(s.dimNome || "") + "] " + limpa(s.texto || s)); });
  }

  out.push(bloco("METAS DECLARADAS"));
  R.metasDeclaradas.forEach(function (m) { out.push("• " + limpa(m.titulo) + " — " + limpa(m.detalhe)); });

  out.push(bloco("INVESTIMENTO SEGURO"));
  out.push((R.investSeguro.destaque ? "[destaque] " : "") + limpa(R.investSeguro.intro));

  out.push(bloco("PRÓXIMO PASSO"));
  out.push("Duração: " + limpa(R.nextStep.duracao));
  out.push(limpa(R.nextStep.justificativa));
  if (R.checklist && R.checklist.length) {
    out.push(bloco("CHECKLIST 30 DIAS"));
    R.checklist.forEach(function (c) { out.push("[ ] " + limpa(typeof c === "string" ? c : JSON.stringify(c))); });
  }

  console.log(out.join("\n"));
}

if (require.main === module) {
  var filtro = process.argv[2];
  PERFIS.filter(function (p) { return !filtro || p.id === filtro; }).forEach(imprime);
}

module.exports = { PERFIS: PERFIS, base: base, REF: REF };
