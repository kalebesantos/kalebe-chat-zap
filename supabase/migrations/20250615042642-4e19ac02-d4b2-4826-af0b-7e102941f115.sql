
-- Criar tabela para configurações do bot
CREATE TABLE public.bot_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  chave TEXT UNIQUE NOT NULL,
  valor TEXT NOT NULL,
  descricao TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Inserir configuração padrão do modo (aberto)
INSERT INTO public.bot_config (chave, valor, descricao)
VALUES ('modo_resposta', 'aberto', 'Modo de resposta do bot: aberto ou restrito');

-- Habilitar RLS na tabela
ALTER TABLE public.bot_config ENABLE ROW LEVEL SECURITY;

-- Criar políticas para permitir acesso público (para o bot)
CREATE POLICY "Allow public access to bot_config" ON public.bot_config
  FOR ALL USING (true);
