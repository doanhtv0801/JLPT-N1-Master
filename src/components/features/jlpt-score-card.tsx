import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ScorePrediction } from "@/types/statistics";
import { cn } from "@/lib/utils";

interface JlptScoreCardProps {
  prediction: ScorePrediction;
  className?: string;
}

const SECTIONS: { key: keyof Pick<ScorePrediction, "languageKnowledge" | "reading" | "listening">; label: string }[] = [
  { key: "languageKnowledge", label: "Language Knowledge" },
  { key: "reading", label: "Reading" },
  { key: "listening", label: "Listening" },
];

export function JlptScoreCard({ prediction, className }: JlptScoreCardProps) {
  return (
    <Card className={cn(className)}>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle>180 Project — Estimated Score</CardTitle>
        <span className="text-xs text-muted-foreground capitalize">{prediction.confidence} confidence</span>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-4xl font-semibold tracking-tight tabular-nums">
              {prediction.total}
              <span className="text-lg font-normal text-muted-foreground"> / 180</span>
            </p>
            <p className="text-sm text-muted-foreground">Your target: 180 / 180</p>
          </div>
        </div>
        <div className="flex flex-col gap-3">
          {SECTIONS.map((s) => (
            <div key={s.key} className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{s.label}</span>
              <span className="font-medium tabular-nums">{prediction[s.key]} / 60</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          This is an internal estimate based on your mastery and quiz accuracy — not an official JLPT score
          prediction.
        </p>
      </CardContent>
    </Card>
  );
}
