
-- Cria a tabela admin_config para persistir o número do admin WhatsApp atual.
create table if not exists public.admin_config (
  id uuid primary key default gen_random_uuid(),
  numero_whatsapp text not null,
  nome_admin text,
  criado_em timestamp with time zone default now(),
  atualizado_em timestamp with time zone default now()
);

-- (Opcional) Garante que só exista um admin principal — implementado por configurações no sistema, mas
-- permite manter histórico se precisar no futuro.

-- TODO: Sem RLS por se tratar de serviço backend (Node), caso acesso web seja implementado, revisar isso!

