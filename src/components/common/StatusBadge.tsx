
import { BotStatus } from "@/hooks/useBotOnlineStatus";

interface StatusBadgeProps {
  status: BotStatus;
}

const config = {
  offline: { color: "bg-gray-100 text-gray-500 border-gray-200", dot: "bg-gray-400", label: "Desligado" },
  starting: { color: "bg-blue-100 text-blue-700 border-blue-200", dot: "bg-blue-400", label: "Inicializando" },
  qr_pending: { color: "bg-orange-100 text-orange-700 border-orange-200", dot: "bg-orange-400 animate-pulse", label: "QR Code" },
  authenticated: { color: "bg-blue-100 text-blue-700 border-blue-200", dot: "bg-blue-500", label: "Autenticado" },
  online: { color: "bg-green-100 text-green-700 border-green-200", dot: "bg-green-500", label: "Online" },
  error: { color: "bg-red-100 text-red-700 border-red-200", dot: "bg-red-500 animate-pulse", label: "Erro" },
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const c = config[status] || config.offline;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${c.color}`}>
      <span className={`w-2 h-2 rounded-full inline-block ${c.dot}`} />
      {c.label}
    </span>
  );
}
