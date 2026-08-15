-- ─────────────────────────────────────────────────────────────
--  supabase-setup.sql — HZ Invest · Diagnóstico Financeiro
--
--  Execute este script no seu projeto Supabase:
--  painel do Supabase > SQL Editor > New query > cole tudo > Run.
--
--  Pode ser executado quantas vezes quiser: o script é idempotente
--  (não duplica nada e não apaga dados já gravados).
--
--  Depois de rodar, abra supabase-teste.html no site para conferir
--  se a tabela e o bucket estão respondendo.
--
--  As chaves do projeto (Project URL e anon public, em
--  Settings > API) ficam no arquivo supabase-config.js do site.
--
--  Modelo de segurança: a chave anon (pública, embutida no site)
--  só permite INSERIR respostas e ENVIAR arquivos de relatório.
--  Ninguém consegue ler, listar, alterar ou apagar dados com ela.
--  Você acessa as respostas e os relatórios pelo painel do
--  Supabase (Table Editor e Storage), que usa sua conta de admin.
-- ─────────────────────────────────────────────────────────────

-- ── 1) Tabela com as respostas do formulário ──────────────────
create table if not exists public.diagnosticos (
  id uuid primary key,
  created_at timestamptz not null default now(),
  nome text,
  email text,
  score integer,
  nivel text,
  arquetipo text,
  respostas jsonb not null,
  relatorio_arquivo text
);

-- Colunas do plano de aposentadoria (adicionadas depois da versão
-- inicial; o "if not exists" mantém o script seguro para rerodar).
alter table public.diagnosticos add column if not exists idade_aposentadoria integer;
alter table public.diagnosticos add column if not exists estrategia text;
alter table public.diagnosticos add column if not exists renda_desejada numeric;
alter table public.diagnosticos add column if not exists patrimonio_necessario numeric;
alter table public.diagnosticos add column if not exists aporte_necessario numeric;
alter table public.diagnosticos add column if not exists aporte_atual numeric;
alter table public.diagnosticos add column if not exists resumo jsonb;

create index if not exists diagnosticos_created_at_idx on public.diagnosticos (created_at desc);
create index if not exists diagnosticos_email_idx on public.diagnosticos (email);

alter table public.diagnosticos enable row level security;

-- Visitantes (chave anon) podem apenas inserir — nunca ler/alterar/apagar.
drop policy if exists "anon insere diagnostico" on public.diagnosticos;
create policy "anon insere diagnostico"
  on public.diagnosticos
  for insert
  to anon
  with check (true);

-- ── 2) Bucket privado para os arquivos de relatório ───────────
insert into storage.buckets (id, name, public)
values ('relatorios', 'relatorios', false)
on conflict (id) do nothing;

-- Visitantes podem apenas enviar arquivos para esse bucket —
-- nunca listar, baixar, sobrescrever ou apagar.
drop policy if exists "anon envia relatorio" on storage.objects;
create policy "anon envia relatorio"
  on storage.objects
  for insert
  to anon
  with check (bucket_id = 'relatorios');

-- ── 3) Conferência ────────────────────────────────────────────
-- Depois do Run, estas duas consultas devem retornar 1 linha cada.
-- Se a segunda vier vazia, o bucket não foi criado: crie-o à mão em
-- Storage > New bucket, com o nome "relatorios" e a opção "Public"
-- DESMARCADA, e rode este script de novo.
select 'tabela diagnosticos' as item, count(*) as ok
  from information_schema.tables
 where table_schema = 'public' and table_name = 'diagnosticos';

select 'bucket relatorios' as item, count(*) as ok
  from storage.buckets where id = 'relatorios';
