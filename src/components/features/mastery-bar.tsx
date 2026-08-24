import { cn, formatPercent } from "@/lib/utils";

function masteryBarColor(value: number): string {
  if (value >= 90) return "bg-mastery-complete";
  if (value >= 70) return "bg-mastery-high";
  if (value >= 40) return "bg-mastery-mid";
  if (value > 0) return "bg-mastery-low";
  return "bg-mastery-0";
}

interface MasteryBarProps {
  label: string;
  value: number;
  className?: string;
}

export function MasteryBar({ label, value, className }: MasteryBarProps) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium tabular-nums">{formatPercent(value)}</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={cn("h-full rounded-full transition-all duration-500 ease-out", masteryBarColor(value))}
          style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
        />
      </div>
    </div>
  );
}
