import { HeartPulse, Thermometer, Wind } from "lucide-react";
import { cn } from "@/lib/utils";

export function VitalsRow({
  temperature,
  heartRate,
  spo2,
  className,
}: {
  temperature: number | null;
  heartRate: number | null;
  spo2: number | null;
  className?: string;
}) {
  const items = [
    { icon: Thermometer, value: temperature === null ? "—" : `${temperature}°C`, label: "Temperature", warn: temperature !== null && temperature >= 38.3 },
    { icon: HeartPulse, value: heartRate === null ? "—" : `${heartRate}`, label: "Heart rate", warn: heartRate !== null && (heartRate >= 110 || heartRate <= 50) },
    { icon: Wind, value: spo2 === null ? "—" : `${spo2}%`, label: "Oxygen saturation", warn: spo2 !== null && spo2 < 94 },
  ];
  return (
    <dl className={cn("flex items-center gap-3 text-xs", className)}>
      {items.map((item) => (
        <div
          key={item.label}
          className={cn("inline-flex items-center gap-1", item.warn ? "font-medium text-danger" : "text-muted-foreground")}
        >
          <item.icon className="h-3.5 w-3.5" aria-hidden="true" />
          <dt className="sr-only">{item.label}</dt>
          <dd className="tabular-nums">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}
