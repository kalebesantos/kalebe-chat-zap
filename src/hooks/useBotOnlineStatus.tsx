
import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useBotOnlineStatus(pollInterval: number = 10000) {
  const [status, setStatus] = useState<"online" | "offline" | "unknown">("unknown");
  const timerRef = useRef<NodeJS.Timeout>();

  const fetchStatus = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("bot_config")
        .select("valor")
        .eq("chave", "bot_online")
        .maybeSingle();

      if (error || !data) {
        setStatus("unknown");
        return;
      }
      setStatus(data.valor === "true" ? "online" : data.valor === "false" ? "offline" : "unknown");
    } catch {
      setStatus("unknown");
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    timerRef.current = setInterval(fetchStatus, pollInterval);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [fetchStatus, pollInterval]);

  return { status, refresh: fetchStatus };
}
