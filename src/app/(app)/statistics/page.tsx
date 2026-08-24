"use client";

import dynamic from "next/dynamic";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/components/features/stat-card";
import { ActivityHeatmap } from "@/components/features/activity-heatmap";
import { WeaknessCard } from "@/components/features/weakness-card";
import { JlptScoreCard } from "@/components/features/jlpt-score-card";
import { useLearningStats } from "@/hooks/use-learning-stats";
import { useLearningStore } from "@/lib/store/learning-store";
import { formatCount, formatMinutes } from "@/lib/utils";

const XpTrendChart = dynamic(() => import("@/components/features/xp-trend-chart"), {
  ssr: false,
  loading: () => <Skeleton className="h-[220px] w-full" />,
});
const MasteryDistributionChart = dynamic(
  () => import("@/components/features/mastery-distribution-chart"),
  { ssr: false, loading: () => <Skeleton className="h-[220px] w-full" /> }
);

export default function StatisticsPage() {
  const stats = useLearningStats();
  const userVocabulary = useLearningStore((s) => s.userVocabulary);

  if (!stats.hasHydrated) return <Skeleton className="mx-auto h-96 max-w-5xl" />;

  const uvList = Object.values(userVocabulary);
  const statusCounts = ["unseen", "learning", "young", "mature", "mastered"].map((status) => ({
    status: status.charAt(0).toUpperCase() + status.slice(1),
    count:
      status === "unseen"
        ? stats.corpusSize - uvList.filter((u) => u.status !== "unseen").length
        : uvList.filter((u) => u.status === status).length,
  }));

  const activityEntries = Object.values(stats.dailyActivity);
  const totalReviewsCompleted = activityEntries.reduce((s, a) => s + a.reviewsCompleted, 0);
  const totalAnswered = activityEntries.reduce((s, a) => s + a.quizQuestionsAnswered, 0);
  const totalCorrect = activityEntries.reduce((s, a) => s + a.correctAnswers, 0);
  const reviewAccuracy = totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0;
  const totalStudyMinutes = activityEntries.reduce((s, a) => s + a.studyTimeMinutes, 0);
  const vocabularyCoverage = Math.round((stats.seenCount / stats.corpusSize) * 100);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Statistics</h1>
        <p className="text-sm text-muted-foreground">Your learning footprint across the demo corpus.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Words Mastered" value={formatCount(stats.masteredCount)} sublabel={`of ${stats.corpusSize} demo words`} />
        <StatCard label="Vocabulary Coverage" value={`${vocabularyCoverage}%`} />
        <StatCard label="Review Accuracy" value={`${reviewAccuracy}%`} sublabel={`${formatCount(totalReviewsCompleted)} reviews completed`} />
        <StatCard label="Total Study Time" value={formatMinutes(totalStudyMinutes)} />
        <StatCard label="Current Streak" value={`${stats.streak.current} days`} />
        <StatCard label="Longest Streak" value={`${stats.streak.longest} days`} />
        <StatCard label="Weakest Skill" value={stats.weakest?.label ?? "—"} />
        <StatCard label="Strongest Skill" value={stats.strongest?.label ?? "—"} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>XP — Last 30 Days</CardTitle></CardHeader>
          <CardContent><XpTrendChart activity={stats.dailyActivity} /></CardContent>
        </Card>
        <JlptScoreCard prediction={stats.scorePrediction} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Mastery Distribution</CardTitle></CardHeader>
          <CardContent><MasteryDistributionChart data={statusCounts} /></CardContent>
        </Card>
        <WeaknessCard weaknesses={stats.weaknesses} />
      </div>

      <Card>
        <CardHeader><CardTitle>Activity Heatmap</CardTitle></CardHeader>
        <CardContent><ActivityHeatmap activity={stats.dailyActivity} /></CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        Reading speed and listening accuracy will appear here once the Reading and Listening modules ship.
      </p>
    </div>
  );
}
