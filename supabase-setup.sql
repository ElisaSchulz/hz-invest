-- ─────────────────────────────────────────────────────────────
--  supabase-setup.sql — HZ Invest · Diagnóstico Financeiro
--
--  Execute este script UMA VEZ no seu projeto Supabase:
--  painel do Supabase > SQL Editor > New query > cole tudo > Run.
--
--  Depois, copie a "Project URL" e a chave "anon public"
--  (Settings > API) para o arquivo supabase-config.js do site.
--
--  Modelo de segurança: a chave anon (pública, embutida no site)
--  só permite INSERIR respostas e ENVIAR arquivos de relatório.
--  Ninguém consegue ler, listar, alterar ou apagar dados com ela.
--  Você acessa as respostas e os relatórios pelo painel do
--  Supabase (Table Editor e Storage), que usa sua conta de admin.
-- ─────────────────────────────────────────────────────────────

-- 1) Tabela com as respostas do formulário
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

alter table public.diagnosticos enable row level security;

-- Visitantes (chave anon) podem apenas inserir — nunca ler/alterar/apagar.
drop policy if exists "anon insere diagnostico" on public.diagnosticos;
create policy "anon insere diagnostico"
  on public.diagnosticos
  for insert
  to anon
  with check (true);

-- 2) Bucket privado para os arquivos de relatório gerados
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
