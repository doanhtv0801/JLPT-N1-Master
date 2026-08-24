"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AudioButton } from "@/components/features/audio-button";
import { QuestionCard } from "@/components/features/question-card";
import { VOCABULARY } from "@/data/vocabulary";
import { useLearningStore } from "@/lib/store/learning-store";
import { generateQuestion } from "@/services/quiz";
import { toast } from "sonner";

const STEP_LABELS = [
  "Word",
  "Pronunciation",
  "Meaning",
  "Example",
  "Collocations",
  "Synonyms",
  "Quick Recall",
];
const TOTAL_STEPS = STEP_LABELS.length;

function LearnSessionInner() {
  const params = useSearchParams();
  const count = Math.max(1, Math.min(50, Number(params.get("count")) || 10));

  // The store persists to localStorage and rehydrates asynchronously (see
  // StoreHydration), so on a fresh page load `userVocabulary` starts out
  // empty for a beat. LearnSessionRunner freezes its word list once, on
  // mount — so it must not mount until hydration (and the one-time demo
  // seed) has actually finished, or it would freeze an empty session forever.
  const hasHydrated = useLearningStore((s) => s.hasHydrated);

  if (!hasHydrated) {
    return (
      <div className="mx-auto flex max-w-xl flex-col gap-5">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-72 w-full" />
      </div>
    );
  }

  return <LearnSessionRunner count={count} />;
}

function LearnSessionRunner({ count }: { count: number }) {
  const router = useRouter();
  const userVocabulary = useLearningStore((s) => s.userVocabulary);
  const learnNewWord = useLearningStore((s) => s.learnNewWord);
  const answerQuestion = useLearningStore((s) => s.answerQuestion);

  // Captured ONCE when the session starts (lazy initializer, safe now that
  // this component only mounts post-hydration), not recomputed from live
  // store state. learnNewWord() flips a word's status away from "unseen" the
  // moment it's learned, so a reactive useMemo here would drop the
  // just-learned word out of the list mid-session and shift every later
  // index — skipping words, or letting new unseen words slide into view
  // unexpectedly as the session progresses.
  const [sessionWords] = useState(() => {
    const unseen = VOCABULARY.filter((v) => (userVocabulary[v.id]?.status ?? "unseen") === "unseen");
    return unseen.slice(0, count);
  });

  const [wordIndex, setWordIndex] = useState(0);
  const [step, setStep] = useState(1);
  const [finished, setFinished] = useState(false);
  const [xpEarned, setXpEarned] = useState(0);

  const currentWord = sessionWords[wordIndex];
  const question = useMemo(() => {
    if (!currentWord || step !== 7) return null;
    return generateQuestion(currentWord, Math.random() > 0.5 ? "reading" : "meaning", VOCABULARY);
  }, [currentWord, step]);

  if (sessionWords.length === 0) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-4 py-16 text-center">
        <p className="text-sm text-muted-foreground">No new words available right now.</p>
        <Button onClick={() => router.push("/learn")}>Back to Learn</Button>
      </div>
    );
  }

  if (finished) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-4 py-16 text-center">
        <CheckCircle2 className="size-10 text-success" />
        <h1 className="text-2xl font-semibold">Session complete</h1>
        <p className="text-sm text-muted-foreground">
          You learned {sessionWords.length} new words and earned {xpEarned} XP.
        </p>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push("/vocabulary")}>Browse Vocabulary</Button>
          <Button onClick={() => router.push("/review")}>Start a Review</Button>
        </div>
      </div>
    );
  }

  function goNextStep() {
    if (step < TOTAL_STEPS) {
      setStep((s) => s + 1);
      return;
    }
    advanceWord();
  }

  function advanceWord() {
    if (wordIndex + 1 >= sessionWords.length) {
      setFinished(true);
    } else {
      setWordIndex((i) => i + 1);
      setStep(1);
    }
  }

  function handleRecallAnswer(_optionId: string, correct: boolean, responseTimeMs: number) {
    learnNewWord(currentWord.id);
    const dimension = question?.type === "reading" ? "reading" : "meaning";
    const result = answerQuestion({
      vocabularyId: currentWord.id,
      dimension,
      correct,
      responseTimeMs,
      mode: "learn",
    });
    setXpEarned((x) => x + result.xpEarned + 15);
    if (correct) toast.success("Nice — added to your review queue.");
    setTimeout(advanceWord, 900);
  }

  const overallProgress = Math.round(
    ((wordIndex * TOTAL_STEPS + (step - 1)) / (sessionWords.length * TOTAL_STEPS)) * 100
  );

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-5">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Word {wordIndex + 1} of {sessionWords.length}</span>
          <span>{STEP_LABELS[step - 1]}</span>
        </div>
        <Progress value={overallProgress} />
      </div>

      {step === 7 && question ? (
        <QuestionCard key={question.id} question={question} onAnswer={handleRecallAnswer} />
      ) : (
        <Card className="min-h-72 items-center justify-center gap-4 text-center">
          {step === 1 && (
            <>
              <p className="font-jp text-6xl font-medium">{currentWord.word}</p>
              <div className="flex flex-wrap justify-center gap-1.5">
                {currentWord.partOfSpeech.map((p) => (
                  <Badge key={p} variant="secondary" className="capitalize">{p.replace("-", " ")}</Badge>
                ))}
              </div>
            </>
          )}
          {step === 2 && (
            <>
              <p className="font-jp text-4xl">{currentWord.word}</p>
              <div className="flex items-center gap-2">
                <p className="text-2xl text-muted-foreground">{currentWord.reading}</p>
                <AudioButton text={currentWord.word} />
              </div>
              <p className="text-sm text-muted-foreground">{currentWord.romaji}</p>
            </>
          )}
          {step === 3 && (
            <>
              <p className="font-jp text-3xl">{currentWord.word}</p>
              <p className="text-lg">{currentWord.meaningEn.join("; ")}</p>
              <p className="text-sm text-muted-foreground">{currentWord.definitionJa}</p>
            </>
          )}
          {step === 4 && currentWord.examples[0] && (
            <>
              <p className="font-jp text-xl leading-relaxed">{currentWord.examples[0].japanese}</p>
              <p className="text-sm text-muted-foreground">{currentWord.examples[0].translationEn}</p>
            </>
          )}
          {step === 5 && (
            <div className="flex flex-col gap-2">
              {currentWord.collocations.length > 0 ? (
                currentWord.collocations.map((c) => (
                  <p key={c.id} className="font-jp text-lg">{c.phrase} <span className="text-sm text-muted-foreground">— {c.translationEn}</span></p>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No collocations recorded for this word yet.</p>
              )}
            </div>
          )}
          {step === 6 && (
            <div className="flex flex-col gap-2">
              {currentWord.synonyms.length > 0 ? (
                currentWord.synonyms.map((s) => (
                  <p key={s.vocabularyId} className="font-jp text-lg">{s.word} <span className="text-sm text-muted-foreground">({s.reading})</span></p>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No close synonyms recorded for this word yet.</p>
              )}
            </div>
          )}
        </Card>
      )}

      {step !== 7 && (
        <Button onClick={goNextStep} className="self-end">
          Continue
        </Button>
      )}
    </div>
  );
}

export default function LearnSessionPage() {
  return (
    <Suspense>
      <LearnSessionInner />
    </Suspense>
  );
}
