# Testes de perfil do diagnóstico

Dois scripts que rodam o motor do relatório (`diagnostico-core.js`) fora do
navegador, sem dependências: só `node`.

## `perfis.js`

Dez perfis sintéticos, um por arquétipo mais três casos de borda (jovem no
primeiro emprego, aposentado, renda alta com patrimônio financiado). Cada perfil
declara a história da pessoa e o que se espera do relatório, e o script imprime
o relatório inteiro em texto: score, nível, dimensões, arquétipo, KPIs,
projeção de aposentadoria, plano de ação, pontos fortes e checklist.

```
node testes/perfis.js            # todos os perfis
node testes/perfis.js paralisia  # um perfil só
```

A data de referência é fixa (`REF`), então as idades e os números não mudam de
um dia pro outro.

## `coerencia.js`

Roda todos os perfis contra um conjunto de regras que qualquer relatório
deveria respeitar — o arquétipo bate com o plano de ação, o nível não elogia
quem está em faixa crítica, o texto não cita uma carteira que não existe,
aposentado não recebe plano de acumulação. Sai com código 1 se alguma regra
for violada.

```
node testes/coerencia.js
```

As regras são declarativas: para acrescentar uma, basta adicionar um objeto
`{ id, desc, check }` ao array `REGRAS`, onde `check(R, perfil)` devolve a
mensagem da violação ou `null`.
