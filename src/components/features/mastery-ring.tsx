import { ProgressRing } from "./progress-ring";
import { cn, formatPercent } from "@/lib/utils";

function masteryColorClass(value: number): string {
  if (value >= 90) return "stroke-mastery-complete";
  if (value >= 70) return "stroke-mastery-high";
  if (value >= 40) return "stroke-mastery-mid";
  if (value > 0) return "stroke-mastery-low";
  return "stroke-mastery-0";
}

interface MasteryRingProps {
  value: number;
  size?: number;
  label?: string;
  className?: string;
}

export function MasteryRing({ value, size = 64, label, className }: MasteryRingProps) {
  return (
    <ProgressRing
      value={value}
      size={size}
      strokeWidth={size < 48 ? 4 : 6}
      indicatorClassName={masteryColorClass(value)}
      className={className}
    >
      <div className="flex flex-col items-center leading-none">
        <span className={cn("font-semibold tabular-nums", size >= 64 ? "text-base" : "text-xs")}>
          {formatPercent(value)}
        </span>
        {label && size >= 64 && <span className="mt-0.5 text-[10px] text-muted-foreground">{label}</span>}
      </div>
    </ProgressRing>
  );
}
