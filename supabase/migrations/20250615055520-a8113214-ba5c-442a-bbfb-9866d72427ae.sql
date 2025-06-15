
-- Criar tabela para armazenar transcrições de áudio
CREATE TABLE public.audio_transcriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id UUID REFERENCES public.usuarios(id),
  arquivo_original TEXT NOT NULL,
  duracao_segundos DECIMAL(5,2),
  tamanho_bytes INTEGER,
  texto_transcrito TEXT NOT NULL,
  confianca_transcricao DECIMAL(3,2),
  tempo_processamento_ms INTEGER,
  status TEXT DEFAULT 'sucesso' CHECK (status IN ('sucesso', 'erro', 'processando')),
  erro_detalhes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Adicionar configuração para habilitar/desabilitar transcrição de áudio
INSERT INTO public.bot_config (chave, valor, descricao)
VALUES ('transcricao_audio_ativa', 'true', 'Habilita ou desabilita a transcrição automática de áudios (true/false)');

-- Habilitar RLS na nova tabela
ALTER TABLE public.audio_transcriptions ENABLE ROW LEVEL SECURITY;

-- Política RLS básica
CREATE POLICY "Allow all access to audio_transcriptions" ON public.audio_transcriptions FOR ALL USING (true);
