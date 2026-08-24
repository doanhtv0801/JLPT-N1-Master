"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { QuestionCard } from "@/components/features/question-card";
import { VOCABULARY, getVocabularyById } from "@/data/vocabulary";
import { useLearningStore } from "@/lib/store/learning-store";
import { generateQuestion } from "@/services/quiz";
import { isDue, selectQuestionType, dimensionForQuestionType } from "@/services/srs";
import type { QuestionType } from "@/types/quiz";

const DIMENSION_FORCED_TYPE: Record<string, QuestionType> = {
  synonym: "synonym",
  collocation: "collocation",
};

function ReviewSessionInner() {
  const params = useSearchParams();
  const mode = params.get("mode") ?? "due";
  const forcedDimension = params.get("dimension");

  // The store persists to localStorage and rehydrates asynchronously (see
  // StoreHydration), so on a fresh page load `userVocabulary` starts out
  // empty for a beat. ReviewSessionRunner freezes its review queue once, on
  // mount — so it must not mount until hydration (and the one-time demo
  // seed) has actually finished, or it would freeze an empty queue forever.
  const hasHydrated = useLearningStore((s) => s.hasHydrated);

  if (!hasHydrated) {
    return (
      <div className="mx-auto flex max-w-xl flex-col gap-5">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-72 w-full" />
      </div>
    );
  }

  return <ReviewSessionRunner mode={mode} forcedDimension={forcedDimension} />;
}

function ReviewSessionRunner({
  mode,
  forcedDimension,
}: {
  mode: string;
  forcedDimension: string | null;
}) {
  const router = useRouter();
  const userVocabulary = useLearningStore((s) => s.userVocabulary);
  const answerQuestion = useLearningStore((s) => s.answerQuestion);
  const addMistake = useLearningStore((s) => s.addMistake);

  // Captured ONCE when the session starts (lazy initializer, safe now that
  // this component only mounts post-hydration), not recomputed from live
  // store state. Answering a word updates its SRS/mastery in the store
  // immediately, so a reactive useMemo here would shrink or reorder the
  // queue mid-session (e.g. a "due" word stops being due the instant it's
  // answered) — that previously caused the progress denominator to change
  // under the learner's feet and could skip or repeat words.
  const [queueIds] = useState(() => {
    const seen = Object.values(userVocabulary).filter((u) => u.status !== "unseen");
    let list = seen;
    if (forcedDimension) {
      list = [...seen].sort(
        (a, b) => a.mastery[forcedDimension as keyof typeof a.mastery] - b.mastery[forcedDimension as keyof typeof b.mastery]
      );
    } else if (mode === "weak") {
      list = seen.filter((u) => u.overallMastery < 50).sort((a, b) => a.overallMastery - b.overallMastery);
    } else {
      list = seen.filter((u) => isDue(u.srs)).sort(
        (a, b) => new Date(a.srs.nextReviewAt).getTime() - new Date(b.srs.nextReviewAt).getTime()
      );
    }
    return list.slice(0, 20).map((u) => u.vocabularyId);
  });

  const [index, setIndex] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [xpEarned, setXpEarned] = useState(0);
  const [finished, setFinished] = useState(false);

  const currentId = queueIds[index];
  const currentVocab = currentId ? getVocabularyById(currentId) : undefined;
  const currentUv = currentId ? userVocabulary[currentId] : undefined;

  const question = useMemo(() => {
    if (!currentVocab || !currentUv) return null;
    const type =
      forcedDimension && DIMENSION_FORCED_TYPE[forcedDimension]
        ? DIMENSION_FORCED_TYPE[forcedDimension]
        : selectQuestionType(
            currentUv.mastery,
            currentVocab.synonyms.length > 0,
            currentVocab.confusingWords.length > 0,
            currentVocab.collocations.length > 0
          );
    return generateQuestion(currentVocab, type, VOCABULARY);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentId]);

  if (queueIds.length === 0) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-4 py-16 text-center">
        <p className="text-sm text-muted-foreground">Nothing to review for this queue right now.</p>
        <Button onClick={() => router.push("/review")}>Back to Review</Button>
      </div>
    );
  }

  if (finished) {
    const accuracy = Math.round((correctCount / queueIds.length) * 100);
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-4 py-16 text-center">
        <CheckCircle2 className="size-10 text-success" />
        <h1 className="text-2xl font-semibold">Review complete</h1>
        <p className="text-sm text-muted-foreground">
          {correctCount} / {queueIds.length} correct ({accuracy}%) — {xpEarned} XP earned.
        </p>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push("/dashboard")}>Dashboard</Button>
          <Button onClick={() => router.push("/review")}>Back to Review</Button>
        </div>
      </div>
    );
  }

  function handleAnswer(optionId: string, correct: boolean, responseTimeMs: number) {
    if (!currentVocab || !question) return;
    const dimension = dimensionForQuestionType(question.type);
    const result = answerQuestion({
      vocabularyId: currentVocab.id,
      dimension,
      correct,
      responseTimeMs,
      mode: "review",
    });
    if (correct) setCorrectCount((c) => c + 1);
    setXpEarned((x) => x + result.xpEarned);

    if (!correct) {
      const selected = question.options.find((o) => o.id === optionId);
      const correctOption = question.options.find((o) => o.isCorrect);
      addMistake({
        vocabularyId: currentVocab.id,
        questionType: question.type,
        selectedAnswer: selected?.label ?? "(none)",
        correctAnswer: correctOption?.label ?? "",
        answeredAt: new Date().toISOString(),
        responseTimeMs,
      });
    }

    setTimeout(() => {
      if (index + 1 >= queueIds.length) setFinished(true);
      else setIndex((i) => i + 1);
    }, 900);
  }

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-5">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Word {index + 1} of {queueIds.length}</span>
          <span>{correctCount} correct</span>
        </div>
        <Progress value={Math.round((index / queueIds.length) * 100)} />
      </div>
      {question && <QuestionCard key={question.id} question={question} onAnswer={handleAnswer} />}
    </div>
  );
}

export default function ReviewSessionPage() {
  return (
    <Suspense>
      <ReviewSessionInner />
    </Suspense>
  );
}
