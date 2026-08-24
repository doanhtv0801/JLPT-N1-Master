import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { WeaknessScore } from "@/types/statistics";
import { cn } from "@/lib/utils";

const CLASSIFICATION_VARIANT: Record<WeaknessScore["classification"], "destructive" | "warning" | "secondary" | "success" | "muted"> = {
  critical: "destructive",
  weak: "warning",
  improving: "secondary",
  strong: "success",
  mastered: "success",
};

interface WeaknessCardProps {
  weaknesses: WeaknessScore[];
  className?: string;
}

export function WeaknessCard({ weaknesses, className }: WeaknessCardProps) {
  return (
    <Card className={cn(className)}>
      <CardHeader>
        <CardTitle>Weakness Analysis</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {weaknesses.map((w) => (
          <div key={w.category} className="flex items-center justify-between gap-3">
            <span className="text-sm">{w.label}</span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium tabular-nums">{w.score}%</span>
              <Badge variant={CLASSIFICATION_VARIANT[w.classification]} className="capitalize">
                {w.classification}
              </Badge>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
