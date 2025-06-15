
import { Badge } from "@/components/ui/badge";

interface StatusBadgeProps {
  status: "online" | "offline" | "unknown";
}

const statusConfig = {
  online: {
    color: "bg-green-100 text-green-700 border-green-200",
    dot: "bg-green-500",
    label: "Online",
    pulse: "animate-pulse",
  },
  offline: {
    color: "bg-gray-100 text-gray-500 border-gray-200",
    dot: "bg-gray-400 opacity-70",
    label: "Offline",
    pulse: "animate-pulse",
  },
  unknown: {
    color: "bg-yellow-100 text-yellow-700 border-yellow-200",
    dot: "bg-yellow-400 opacity-70",
    label: "Desconhecido",
    pulse: "animate-pulse",
  },
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const { color, dot, label, pulse } = statusConfig[status];

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${color} ${pulse}`}
    >
      <span className={`w-2 h-2 rounded-full inline-block ${dot}`} />
      {label}
    </span>
  );
}
