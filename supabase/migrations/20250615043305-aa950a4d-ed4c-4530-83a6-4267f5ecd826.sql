
-- Criar tabela para controlar conversas ativas
CREATE TABLE public.conversas_ativas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
  ativo BOOLEAN NOT NULL DEFAULT true,
  admin_iniciou BOOLEAN NOT NULL DEFAULT false,
  ultima_atividade TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(usuario_id)
);

-- Habilitar RLS na tabela
ALTER TABLE public.conversas_ativas ENABLE ROW LEVEL SECURITY;

-- Criar políticas para permitir acesso público (para o bot)
CREATE POLICY "Allow public access to conversas_ativas" ON public.conversas_ativas
  FOR ALL USING (true);

-- Criar índice para melhor performance
CREATE INDEX idx_conversas_ativas_usuario_id ON public.conversas_ativas(usuario_id);
CREATE INDEX idx_conversas_ativas_ativo ON public.conversas_ativas(ativo);
