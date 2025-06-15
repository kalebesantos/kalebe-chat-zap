
import { Card, CardContent } from "@/components/ui/card";
import { ReactNode } from "react";

interface MetricCardProps {
  value: ReactNode;
  label: string;
  colorClass?: string;
  icon?: ReactNode;
}
export function MetricCard({ value, label, colorClass, icon }: MetricCardProps) {
  return (
    <Card>
      <CardContent className="p-4 text-center">
        <div className={`text-2xl font-bold ${colorClass || "text-blue-600"} flex gap-2 justify-center items-center`}>
          {icon}
          {value}
        </div>
        <div className="text-sm text-gray-600">{label}</div>
      </CardContent>
    </Card>
  );
}
