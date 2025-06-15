
-- Criar tabela granular de status do bot
CREATE TABLE IF NOT EXISTS public.bot_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  status TEXT NOT NULL CHECK (status IN ('offline', 'starting', 'qr_pending', 'authenticated', 'online', 'error')),
  last_heartbeat TIMESTAMPTZ NOT NULL DEFAULT now(),
  error_message TEXT,
  qr_code TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Garantir apenas uma linha (sempre a mais recente está ativa)
CREATE OR REPLACE FUNCTION public.upsert_bot_status(p_status TEXT, p_error_message TEXT DEFAULT NULL, p_qr_code TEXT DEFAULT NULL)
RETURNS void AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.bot_status) THEN
    UPDATE public.bot_status SET
      status = p_status,
      updated_at = now(),
      last_heartbeat = now(),
      error_message = p_error_message,
      qr_code = p_qr_code
    WHERE id = (SELECT id FROM public.bot_status LIMIT 1);
  ELSE
    INSERT INTO public.bot_status (status, error_message, qr_code)
    VALUES (p_status, p_error_message, p_qr_code);
  END IF;
END;
$$ LANGUAGE plpgsql;

-- (Opcional) Permitir só leitura ao painel (apenas para o projeto: ajustar política depois!)
-- Aqui só está criando a estrutura. RLS/políticas sob medida podem ser aplicadas se necessário.

