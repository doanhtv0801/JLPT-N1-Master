"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useLearningStats } from "@/hooks/use-learning-stats";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCount } from "@/lib/utils";

const GOAL_LABEL: Record<string, string> = {
  "pass-n1": "Pass N1",
  "score-120": "Score 120+",
  "score-150": "Score 150+",
  "aim-180": "Aim for 180",
  "master-japanese": "Master Japanese",
};

const LEVEL_LABEL: Record<string, string> = {
  N3: "N3",
  N2: "N2",
  N1: "N1",
  "passed-N1": "Passed N1",
};

export default function ProfilePage() {
  const stats = useLearningStats();

  if (!stats.hasHydrated) return <Skeleton className="mx-auto h-64 max-w-2xl" />;

  const { profile } = stats;

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <Card>
        <CardContent className="flex items-center gap-4">
          <Avatar className="size-16">
            <AvatarFallback className="text-xl">{profile.name.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col gap-1">
            <h1 className="text-xl font-semibold">{profile.name}</h1>
            <div className="flex flex-wrap gap-1.5">
              <Badge variant="outline">{LEVEL_LABEL[profile.currentLevel]}</Badge>
              <Badge variant="accent">{GOAL_LABEL[profile.goal]}</Badge>
              {profile.isDemo && <Badge variant="muted">Demo Account</Badge>}
            </div>
          </div>
          <Button asChild variant="outline" className="ml-auto">
            <Link href="/settings">Edit Settings</Link>
          </Button>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card className="items-center gap-1 p-4 text-center">
          <span className="text-2xl font-semibold tabular-nums">{formatCount(stats.masteredCount)}</span>
          <span className="text-xs text-muted-foreground">Mastered</span>
        </Card>
        <Card className="items-center gap-1 p-4 text-center">
          <span className="text-2xl font-semibold tabular-nums">{stats.vocabularyMasteryPercent}%</span>
          <span className="text-xs text-muted-foreground">Overall Mastery</span>
        </Card>
        <Card className="items-center gap-1 p-4 text-center">
          <span className="text-2xl font-semibold tabular-nums">{stats.streak.current}</span>
          <span className="text-xs text-muted-foreground">Day Streak</span>
        </Card>
        <Card className="items-center gap-1 p-4 text-center">
          <span className="text-2xl font-semibold tabular-nums">{stats.scorePrediction.total}</span>
          <span className="text-xs text-muted-foreground">Estimated Score</span>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Study Targets</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Daily study time</p>
            <p className="font-medium">{profile.dailyStudyMinutesTarget} min</p>
          </div>
          <div>
            <p className="text-muted-foreground">New words / day</p>
            <p className="font-medium">{profile.dailyNewWordsTarget}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Reviews / day</p>
            <p className="font-medium">{profile.dailyReviewTarget}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
