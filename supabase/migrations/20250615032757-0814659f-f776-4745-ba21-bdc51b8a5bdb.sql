
-- Criar tabela de usuários
CREATE TABLE public.usuarios (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT,
  numero_whatsapp TEXT UNIQUE NOT NULL,
  estilo_fala TEXT DEFAULT 'neutro',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Criar tabela de mensagens
CREATE TABLE public.mensagens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id UUID REFERENCES public.usuarios(id) ON DELETE CASCADE,
  mensagem_recebida TEXT NOT NULL,
  mensagem_enviada TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS nas tabelas
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mensagens ENABLE ROW LEVEL SECURITY;

-- Criar políticas para permitir acesso público (para o bot)
CREATE POLICY "Allow public access to usuarios" ON public.usuarios
  FOR ALL USING (true);

CREATE POLICY "Allow public access to mensagens" ON public.mensagens  
  FOR ALL USING (true);
