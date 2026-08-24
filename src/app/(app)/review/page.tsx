"use client";

import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useLearningStats } from "@/hooks/use-learning-stats";
import { useLearningStore } from "@/lib/store/learning-store";
import { formatCount } from "@/lib/utils";

export default function ReviewOverviewPage() {
  const router = useRouter();
  const stats = useLearningStats();
  const userVocabulary = useLearningStore((s) => s.userVocabulary);

  if (!stats.hasHydrated) return <Skeleton className="mx-auto h-64 max-w-3xl" />;

  const uvList = Object.values(userVocabulary);
  const newCount = uvList.filter((u) => u.status === "learning").length;
  const learningCount = uvList.filter((u) => u.status === "young").length;
  const weakCount = uvList.filter((u) => u.status !== "unseen" && u.overallMastery < 50).length;

  const summary = [
    { label: "Due Today", value: stats.dueCount },
    { label: "New", value: newCount },
    { label: "Learning", value: learningCount },
    { label: "Weak", value: weakCount },
    { label: "Mastered", value: stats.masteredCount },
  ];

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Review</h1>
        <p className="text-sm text-muted-foreground">Smart review prioritizes whichever mastery dimension is weakest for each word.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
        {summary.map((s) => (
          <Card key={s.label} className="items-center gap-1 p-4 text-center">
            <span className="text-2xl font-semibold tabular-nums">{formatCount(s.value)}</span>
            <span className="text-xs text-muted-foreground">{s.label}</span>
          </Card>
        ))}
      </div>

      {stats.dueCount === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-8 text-center">
            <p className="text-sm text-muted-foreground">You&apos;re all caught up. Practice your weak vocabulary instead.</p>
            <Button onClick={() => router.push("/review/session?mode=weak")}>Practice Weak Words</Button>
          </CardContent>
        </Card>
      ) : (
        <Button size="lg" onClick={() => router.push("/review/session?mode=due")}>
          Start Smart Review ({stats.dueCount})
        </Button>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Button variant="outline" onClick={() => router.push("/review/session?mode=weak")}>Review Weak Words</Button>
        <Button variant="outline" onClick={() => router.push("/review/session?dimension=synonym")}>Review Synonyms</Button>
        <Button variant="outline" onClick={() => router.push("/review/session?dimension=collocation")}>Review Collocations</Button>
      </div>
    </div>
  );
}
