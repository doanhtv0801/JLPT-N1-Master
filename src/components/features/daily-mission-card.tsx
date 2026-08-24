import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import type { DailyMission } from "@/types";
import { missionCompletion } from "@/types/activity";
import { formatCount } from "@/lib/utils";

interface DailyMissionCardProps {
  mission: DailyMission;
}

const ROWS: { key: keyof DailyMission; targetKey: keyof DailyMission; label: string }[] = [
  { key: "newWordsDone", targetKey: "newWordsTarget", label: "New Words" },
  { key: "reviewsDone", targetKey: "reviewsTarget", label: "Reviews" },
  { key: "synonymQuestionsDone", targetKey: "synonymQuestionsTarget", label: "Synonym Questions" },
  { key: "collocationQuestionsDone", targetKey: "collocationQuestionsTarget", label: "Collocation Questions" },
];

export function DailyMissionCard({ mission }: DailyMissionCardProps) {
  const completion = missionCompletion(mission);

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle>Today&apos;s Mission</CardTitle>
        <span className="text-sm font-medium tabular-nums">{completion}%</span>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <Progress value={completion} />
        <p className="text-xs text-muted-foreground">
          {formatCount(mission.xpEarned)} / {formatCount(mission.xpTarget)} XP today
        </p>
        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
          {ROWS.map((row) => (
            <div key={row.key} className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{row.label}</span>
              <span className="tabular-nums">
                {mission[row.key] as number} / {mission[row.targetKey] as number}
              </span>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <Button asChild size="sm" className="flex-1">
            <Link href="/learn">Learn New Words</Link>
          </Button>
          <Button asChild size="sm" variant="outline" className="flex-1">
            <Link href="/review">Start Review</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
