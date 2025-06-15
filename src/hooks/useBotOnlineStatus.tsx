import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const statusMap = {
  offline: { display: "Desligado", code: "offline" },
  starting: { display: "Inicializando", code: "starting" },
  qr_pending: { display: "QR Code - Autenticar", code: "qr_pending" },
  authenticated: { display: "Autenticado, conectando...", code: "authenticated" },
  online: { display: "Online", code: "online" },
  error: { display: "Erro", code: "error" },
};

export type BotStatus = keyof typeof statusMap;

export function useBotOnlineStatus(pollInterval: number = 10000) {
  const [status, setStatus] = useState<BotStatus>("offline");
  const [lastHeartbeat, setLastHeartbeat] = useState<Date|null>(null);
  const [errorMessage, setErrorMessage] = useState<string|null>(null);
  const [qrCode, setQrCode] = useState<string|null>(null);
  const timerRef = useRef<NodeJS.Timeout>();

  // Helper to check if status is valid
  function isValidBotStatus(value: any): value is BotStatus {
    return typeof value === "string" && Object.keys(statusMap).includes(value);
  }

  const fetchStatus = useCallback(async () => {
    const { data, error } = await supabase
      .from("bot_status")
      .select("*")
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error || !data) {
      setStatus("offline");
      setErrorMessage("Falha ao obter status.");
      setLastHeartbeat(null);
      setQrCode(null);
      return;
    }

    // Fix: restrict status to enum values
    setStatus(isValidBotStatus(data.status) ? data.status : "offline");
    setErrorMessage(data.error_message || null);
    setLastHeartbeat(data.last_heartbeat ? new Date(data.last_heartbeat) : null);
    setQrCode(data.qr_code || null);
  }, []);

  useEffect(() => {
    fetchStatus();
    timerRef.current = setInterval(fetchStatus, pollInterval);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [fetchStatus, pollInterval]);

  return { status, errorMessage, lastHeartbeat, qrCode, refresh: fetchStatus };
}
