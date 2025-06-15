
-- Criar tabela para armazenar análises de histórico de conversas
CREATE TABLE public.conversation_history_analysis (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id TEXT NOT NULL,
  periodo_inicio TIMESTAMP WITH TIME ZONE NOT NULL,
  periodo_fim TIMESTAMP WITH TIME ZONE NOT NULL,
  total_mensagens_analisadas INTEGER DEFAULT 0,
  mensagens_aprovadas INTEGER DEFAULT 0,
  mensagens_rejeitadas INTEGER DEFAULT 0,
  contextos_identificados JSONB,
  padroes_descobertos JSONB,
  qualidade_geral DECIMAL(3,2),
  status TEXT DEFAULT 'processando',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Criar tabela para mensagens candidatas a treinamento
CREATE TABLE public.training_candidates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  analysis_id UUID REFERENCES public.conversation_history_analysis(id) ON DELETE CASCADE,
  mensagem_original TEXT NOT NULL,
  contexto TEXT,
  tipo_resposta TEXT,
  confianca_admin DECIMAL(3,2),
  aprovado BOOLEAN DEFAULT NULL,
  motivo_aprovacao TEXT,
  qualidade_estimada DECIMAL(3,2),
  timestamp_original TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Criar tabela para feedback de qualidade das respostas
CREATE TABLE public.response_feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id UUID REFERENCES public.usuarios(id),
  mensagem_enviada TEXT NOT NULL,
  feedback_tipo TEXT CHECK (feedback_tipo IN ('boa', 'ruim', 'excelente')),
  contexto_conversa TEXT,
  timestamp_resposta TIMESTAMP WITH TIME ZONE,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Criar tabela para contextos de situação
CREATE TABLE public.conversation_contexts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id TEXT NOT NULL,
  tipo_contexto TEXT NOT NULL,
  descricao TEXT,
  palavras_chave TEXT[],
  respostas_padrao TEXT[],
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS nas novas tabelas
ALTER TABLE public.conversation_history_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.response_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_contexts ENABLE ROW LEVEL SECURITY;

-- Políticas RLS básicas (permitir acesso completo por enquanto)
CREATE POLICY "Allow all access to conversation_history_analysis" ON public.conversation_history_analysis FOR ALL USING (true);
CREATE POLICY "Allow all access to training_candidates" ON public.training_candidates FOR ALL USING (true);
CREATE POLICY "Allow all access to response_feedback" ON public.response_feedback FOR ALL USING (true);
CREATE POLICY "Allow all access to conversation_contexts" ON public.conversation_contexts FOR ALL USING (true);
