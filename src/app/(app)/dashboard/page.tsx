"use client";

import Link from "next/link";
import { Flame, RefreshCcw, BookOpen, Target, ArrowRight } from "lucide-react";
import { useLearningStats } from "@/hooks/use-learning-stats";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/components/features/stat-card";
import { DailyMissionCard } from "@/components/features/daily-mission-card";
import { WeaknessCard } from "@/components/features/weakness-card";
import { JlptScoreCard } from "@/components/features/jlpt-score-card";
import { ActivityHeatmap } from "@/components/features/activity-heatmap";
import { MasteryBar } from "@/components/features/mastery-bar";
import { MASTERY_DIMENSION_KEYS, MASTERY_DIMENSION_LABELS } from "@/types/mastery";
import { getVocabularyById } from "@/data/vocabulary";
import { formatCount } from "@/lib/utils";

export default function DashboardPage() {
  const stats = useLearningStats();

  if (!stats.hasHydrated) {
    return (
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <Skeleton className="h-24 w-full" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
        </div>
      </div>
    );
  }

  const firstName = stats.profile.name;

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <div className="flex flex-col gap-1">
        <p className="text-sm text-muted-foreground">Good to see you, {firstName}</p>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">JLPT N1 Master</h1>
          <Badge variant="accent">180 Project</Badge>
          <span className="flex items-center gap-1 text-sm text-muted-foreground">
            <Flame className="size-4 text-accent" /> {stats.streak.current} day streak
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard
          label="Vocabulary Mastery"
          value={`${stats.vocabularyMasteryPercent}%`}
          sublabel={`${formatCount(stats.masteredCount)} mastered / ${formatCount(stats.corpusSize)} demo corpus`}
        />
        <StatCard label="Reviews Due" value={formatCount(stats.dueCount)} icon={RefreshCcw} />
        <StatCard label="New Words Available" value={formatCount(stats.newWordsAvailable)} icon={BookOpen} />
        <StatCard
          label="Predicted JLPT"
          value={`${stats.scorePrediction.total} / 180`}
          icon={Target}
          sublabel="Internal estimate"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <DailyMissionCard mission={stats.todayMission} />
        <JlptScoreCard prediction={stats.scorePrediction} />

        <Card>
          <CardHeader>
            <CardTitle>Review Queue</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col justify-between gap-4">
            {stats.dueCount > 0 ? (
              <>
                <p className="text-sm text-muted-foreground">
                  <span className="text-2xl font-semibold text-foreground">{stats.dueCount}</span> words are
                  due for review right now.
                </p>
                <Button asChild>
                  <Link href="/review">
                    Start Smart Review <ArrowRight className="size-4" />
                  </Link>
                </Button>
              </>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">
                  You&apos;re all caught up. Practice your weak vocabulary instead.
                </p>
                <Button asChild variant="outline">
                  <Link href="/review?mode=weak">Practice Weak Words</Link>
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Vocabulary Mastery Overview</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {MASTERY_DIMENSION_KEYS.map((key) => (
              <MasteryBar key={key} label={MASTERY_DIMENSION_LABELS[key]} value={stats.dimensionAverages[key]} />
            ))}
          </CardContent>
        </Card>
        <WeaknessCard weaknesses={stats.weaknesses} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recently Studied</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-1">
            {stats.recentlyLearned.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nothing studied yet — start your first Learn session to see progress here.
              </p>
            ) : (
              stats.recentlyLearned.map((uv) => {
                const vocab = getVocabularyById(uv.vocabularyId);
                if (!vocab) return null;
                return (
                  <Link
                    key={uv.id}
                    href={`/vocabulary/${vocab.id}`}
                    className="flex items-center justify-between rounded-md px-2 py-2 text-sm hover:bg-secondary/50"
                  >
                    <span className="flex items-baseline gap-2">
                      <span className="font-jp text-base">{vocab.word}</span>
                      <span className="text-muted-foreground">{vocab.reading}</span>
                    </span>
                    <span className="text-xs text-muted-foreground capitalize">{uv.status}</span>
                  </Link>
                );
              })
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recommended Practice</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <Button asChild variant="outline" className="justify-start">
              <Link href="/review?mode=weak">Practice Weak Words</Link>
            </Button>
            <Button asChild variant="outline" className="justify-start">
              <Link href="/review?dimension=synonym">Review Synonyms</Link>
            </Button>
            <Button asChild variant="outline" className="justify-start">
              <Link href="/review?dimension=collocation">Review Collocations</Link>
            </Button>
            <Button asChild variant="outline" className="justify-start">
              <Link href="/vocabulary">Browse Vocabulary</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Study Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <ActivityHeatmap activity={stats.dailyActivity} />
        </CardContent>
      </Card>
    </div>
  );
}
