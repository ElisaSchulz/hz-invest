# Teste fechado do Diagnóstico — como colocar no ar

A página `diagnostico-beta.html` é o convite que você manda no grupo do
Telegram. Ela faz três coisas, na ordem:

1. a pessoa **cria a conta HZ** (ou entra na que já tem);
2. a pessoa **confirma o interesse** num formulário curto;
3. a inscrição é gravada no Firestore com o **uid da conta**, que é o que
   você precisa para liberar o acesso.

O resto deste arquivo é a configuração que precisa existir no Firebase para
isso funcionar. São dois passos de dois minutos cada.

---

## Passo 1 · Criar o contador de vagas

É ele que faz a página dizer "3 vagas restantes de 10" e que fecha o teste
sozinho quando a décima pessoa se inscreve.

No painel do Firebase > **Firestore Database** > *Iniciar coleção* (ou
*Adicionar documento*, se a coleção já existir):

| campo | tipo | valor |
|---|---|---|
| ID da coleção | — | `publico` |
| ID do documento | — | `beta_diagnostico` |
| `inscritos` | number | `0` |
| `limite` | number | `10` |
| `aberto` | boolean | `true` |

Depois disso:

- **para fechar o teste antes da hora**, mude `aberto` para `false`;
- **para abrir mais vagas**, aumente o `limite`;
- **para abrir uma segunda rodada do zero**, volte `inscritos` para `0`
  (as inscrições antigas continuam guardadas, só a contagem reinicia).

Se esse documento não existir, a página **continua funcionando**: as
inscrições são gravadas do mesmo jeito, só sem o número da posição e sem o
aviso de "vagas esgotadas".

---

## Passo 2 · Liberar as regras de segurança

Firebase > **Firestore Database** > aba **Regras**.

⚠️ **Não apague o que já está lá** — os cursos e o controle de compra do
diagnóstico dependem das regras atuais. Cole só os dois blocos abaixo
**dentro** do `match /databases/{database}/documents { … }` que já existe,
junto dos outros `match`.

```
// ── Teste fechado do Diagnóstico ────────────────────────────
// Cada pessoa escreve e lê só a própria inscrição. Ninguém consegue
// listar a coleção pelo site: os e-mails só aparecem para você, no
// painel do Firebase.
match /beta_diagnostico/{uid} {
  allow read, create, update: if request.auth != null && request.auth.uid == uid;
  allow delete: if false;
}

// Contador de vagas: qualquer visitante pode ler (é o "3 de 10" da
// página), e quem está logado só pode somar 1 na contagem — nada
// mais. O limite e o "aberto" só mudam por aqui, no painel.
match /publico/beta_diagnostico {
  allow read: if true;
  allow update: if request.auth != null
    && request.resource.data.diff(resource.data).affectedKeys().hasOnly(['inscritos'])
    && request.resource.data.inscritos == resource.data.inscritos + 1;
  allow create, delete: if false;
}
```

Clique em **Publicar**. Pronto, a página está no ar.

---

## Como ver quem se inscreveu

Firebase > Firestore Database > coleção **`beta_diagnostico`**. Cada
documento é uma pessoa, e o **ID do documento é o uid dela**. Os campos:

| campo | o que é |
|---|---|
| `nome`, `email` | como ela se cadastrou |
| `telegram`, `whatsapp` | por onde falar com ela |
| `momento`, `expectativa` | o que ela respondeu no formulário |
| `situacao` | `vaga` (entrou nas 10), `espera` (lista de espera) ou `registrado` (gravada sem contador) |
| `posicao` | 1 a 10, na ordem de chegada |
| `criadoEm` | data e hora da inscrição |
| `acessoLiberado` | fica `false` até você marcar à mão (veja abaixo) |

Para ordenar pela chegada, use o campo `criadoEm` no painel.

---

## Como liberar o acesso de uma pessoa

É a mesma regra de uma compra — o diagnóstico não sabe distinguir quem
testou de quem pagou, e é isso que a gente quer.

1. copie o **uid** da pessoa (o ID do documento em `beta_diagnostico`);
2. Firestore > coleção **`enrollments`** > documento **`{uid}`** >
   subcoleção **`produtos`** > documento **`diagnostico`**;
3. crie o campo `ativo` (boolean) = **`true`**.

Se o documento `enrollments/{uid}` ainda não existir, o painel deixa criar
na hora, junto com a subcoleção.

Na próxima vez que a pessoa abrir `diagnostico.html` (ou clicar em
"Começar o diagnóstico" na Minha Área), a tela de bloqueio some e ela cai
direto no questionário.

Depois de liberar, vale marcar `acessoLiberado: true` na inscrição dela,
só para você não perder a conta de quem já foi liberado.

**Para tirar o acesso depois do teste**, mude `ativo` para `false` no mesmo
documento.

---

## O que a pessoa vê, passo a passo

1. abre o link do Telegram → página do teste, com as vagas restantes;
2. cria a conta (e-mail e senha, ou Google);
3. preenche nome, Telegram, momento financeiro e os dois aceites;
4. recebe a confirmação com a posição dela ("3ª pessoa inscrita");
5. espera o seu aviso;
6. você libera o acesso → ela entra na Minha Área e faz o diagnóstico.

---

## Quando o produto entrar à venda

Três mudanças, todas em `diagnostico-lp.html`:

1. `HZ_EM_BREVE = false` — tira o aviso de "em breve" e os botões voltam a
   apontar para o checkout;
2. `HZ_CHECKOUT_URL` — cole o link de pagamento do provedor que você usar;
3. opcional: apague o link para o teste fechado no `index.html`
   (`diagnostico-beta.html`), se não quiser mais receber inscrições.

A página do teste pode continuar no ar: ela não é indexada pelo Google
(`noindex`), então só chega nela quem tem o link.
