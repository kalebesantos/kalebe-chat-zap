
-- Criar tabela para armazenar mensagens do administrador
CREATE TABLE public.admin_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id TEXT NOT NULL, -- identificador do admin (número whatsapp ou nome)
  conteudo TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT now(),
  fonte TEXT DEFAULT 'manual', -- 'manual', 'whatsapp_export', 'sistema'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Criar tabela para armazenar perfis de estilo dos administradores
CREATE TABLE public.admin_style_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id TEXT NOT NULL UNIQUE,
  nome_admin TEXT,
  estilo_resumo TEXT, -- resumo do estilo (gerado pela IA)
  exemplos_mensagens TEXT[], -- array com exemplos de mensagens
  palavras_frequentes JSONB, -- palavras/expressões mais usadas
  emojis_frequentes TEXT[],
  tom_comunicacao TEXT, -- formal, informal, descontraído, etc
  vocabulario_caracteristico TEXT[],
  ativo BOOLEAN DEFAULT false, -- se o perfil está sendo usado
  total_mensagens INTEGER DEFAULT 0,
  ultima_atualizacao TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS nas tabelas
ALTER TABLE public.admin_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_style_profiles ENABLE ROW LEVEL SECURITY;

-- Criar políticas para permitir acesso público (para o bot)
CREATE POLICY "Allow public access to admin_messages" ON public.admin_messages
  FOR ALL USING (true);

CREATE POLICY "Allow public access to admin_style_profiles" ON public.admin_style_profiles
  FOR ALL USING (true);

-- Criar índices para melhor performance
CREATE INDEX idx_admin_messages_admin_id ON public.admin_messages(admin_id);
CREATE INDEX idx_admin_messages_timestamp ON public.admin_messages(timestamp);
CREATE INDEX idx_admin_style_profiles_admin_id ON public.admin_style_profiles(admin_id);
CREATE INDEX idx_admin_style_profiles_ativo ON public.admin_style_profiles(ativo);

-- Adicionar configuração para ativar/desativar aprendizado de estilo
INSERT INTO public.bot_config (chave, valor, descricao) 
VALUES ('aprendizado_estilo_ativo', 'false', 'Ativa ou desativa o aprendizado de estilo do administrador')
ON CONFLICT (chave) DO NOTHING;
