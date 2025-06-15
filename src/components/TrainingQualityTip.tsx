
import { Badge } from "@/components/ui/badge";
import React from "react";

interface TrainingQualityTipProps {
  count: number;
  minQuality?: number;
}

export function TrainingQualityTip({ count, minQuality = 15 }: TrainingQualityTipProps) {
  const isBelowMin = count < minQuality;

  return (
    <div
      className="rounded-lg p-3 mb-2"
      style={{
        background: isBelowMin
          ? "linear-gradient(90deg,#fffbe9 40%,#ffe2e2 100%)"
          : "linear-gradient(90deg,#e7fff6 40%,#f3ffe2 100%)",
      }}
    >
      <div className="flex items-center gap-3">
        {isBelowMin ? (
          <>
            <span className="text-amber-700 font-bold">Poucos exemplos!</span>
            <span className="text-sm text-gray-600">
              Adicione pelo menos <b>{minQuality} mensagens</b> para garantir um melhor aprendizado do estilo do bot.
            </span>
          </>
        ) : (
          <>
            <span className="text-green-600 font-bold">Ótimo aprendizado!</span>
            <span className="text-sm text-gray-600">
              Continue adicionando exemplos variados e reais para “ensinar” melhor a IA a imitar seu jeito.
            </span>
          </>
        )}
      </div>
    </div>
  );
}
