"use client";

import { useRouter } from "next/navigation";
import { GraduationCap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLearningStats } from "@/hooks/use-learning-stats";
import { Skeleton } from "@/components/ui/skeleton";

const WORD_COUNTS = [10, 20, 30, 50] as const;

export default function LearnConfigPage() {
  const router = useRouter();
  const stats = useLearningStats();

  if (!stats.hasHydrated) return <Skeleton className="mx-auto h-64 max-w-md" />;

  return (
    <div className="mx-auto flex max-w-md flex-col gap-6">
      <div className="flex flex-col items-center gap-2 text-center">
        <GraduationCap className="size-8 text-accent" />
        <h1 className="text-2xl font-semibold tracking-tight">Learn New Words</h1>
        <p className="text-sm text-muted-foreground">
          {stats.newWordsAvailable} new words available in your demo corpus.
        </p>
      </div>

      {stats.newWordsAvailable === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-8 text-center">
            <p className="text-sm text-muted-foreground">
              You&apos;ve learned every word in the current demo corpus — nice work. Head to Review to keep
              strengthening what you know.
            </p>
            <Button onClick={() => router.push("/review")}>Go to Review</Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>How many words today?</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            {WORD_COUNTS.map((count) => {
              const disabled = count > stats.newWordsAvailable && stats.newWordsAvailable > 0;
              const effectiveCount = Math.min(count, stats.newWordsAvailable);
              return (
                <Button
                  key={count}
                  variant="outline"
                  className="h-16 flex-col gap-0.5"
                  disabled={stats.newWordsAvailable === 0}
                  onClick={() => router.push(`/learn/session?count=${effectiveCount}`)}
                >
                  <span className="text-lg font-semibold">{effectiveCount}</span>
                  <span className="text-xs text-muted-foreground">{disabled ? "(all available)" : "words"}</span>
                </Button>
              );
            })}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
