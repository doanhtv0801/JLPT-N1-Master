"use client";

import { useState } from "react";
import { Check, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import type { QuizQuestion } from "@/types/quiz";
import { cn } from "@/lib/utils";

const TYPE_LABEL: Record<QuizQuestion["type"], string> = {
  reading: "Reading",
  meaning: "Meaning",
  context: "Context",
  synonym: "Synonym",
  collocation: "Collocation",
  "confusing-word": "Confusing Word",
  production: "Production",
};

interface QuestionCardProps {
  question: QuizQuestion;
  onAnswer: (optionId: string, correct: boolean, responseTimeMs: number) => void;
}

/** Extracts the 「target word」 out of a production prompt like "「促進」を使って文を作ってください。" */
function extractTargetWord(prompt: string): string | null {
  return prompt.match(/「(.+?)」/)?.[1] ?? null;
}

/**
 * Callers MUST render this with `key={question.id}` (see learn/session and
 * review/session pages) — remounting on a new question is what resets the
 * local state below, rather than an effect synchronizing off a changing prop.
 */
export function QuestionCard({ question, onAnswer }: QuestionCardProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const [startedAt] = useState(() => Date.now());
  const [sentence, setSentence] = useState("");
  const [submitted, setSubmitted] = useState(false);

  if (question.type === "production") {
    const targetWord = extractTargetWord(question.prompt);
    const usesWord = targetWord ? sentence.includes(targetWord) : sentence.trim().length > 0;
    const passesBaseline = usesWord && sentence.trim().length >= 6;

    return (
      <Card className="gap-5">
        <div className="flex items-center justify-between">
          <Badge variant="secondary">{TYPE_LABEL[question.type]}</Badge>
        </div>
        <p className="font-jp text-2xl leading-relaxed">{question.prompt}</p>
        <Textarea
          value={sentence}
          disabled={submitted}
          onChange={(e) => setSentence(e.target.value)}
          placeholder="日本語で文を書いてください..."
          rows={3}
        />
        {!submitted ? (
          <Button
            className="self-end"
            disabled={sentence.trim().length === 0}
            onClick={() => {
              setSubmitted(true);
              onAnswer("production-answer", passesBaseline, Date.now() - startedAt);
            }}
          >
            Submit
          </Button>
        ) : (
          <div
            className={cn(
              "flex items-start gap-2 rounded-md px-3 py-2 text-sm",
              passesBaseline ? "bg-success/10 text-success" : "bg-warning/15 text-warning-foreground"
            )}
          >
            {passesBaseline ? <Check className="mt-0.5 size-4 shrink-0" /> : <X className="mt-0.5 size-4 shrink-0" />}
            <span>
              {passesBaseline
                ? "Baseline check passed — your sentence uses the target word with reasonable length."
                : `Try again next time — make sure to use 「${targetWord ?? "the target word"}」 directly.`}
              <br />
              <span className="text-muted-foreground">{question.explanation}</span>
            </span>
          </div>
        )}
      </Card>
    );
  }

  return (
    <Card className="gap-5">
      <div className="flex items-center justify-between">
        <Badge variant="secondary">{TYPE_LABEL[question.type]}</Badge>
      </div>

      <div className="space-y-2">
        <p className="font-jp text-2xl leading-relaxed">{question.prompt}</p>
        {question.context && <p className="text-sm text-muted-foreground">{question.context}</p>}
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {question.options.map((option) => {
          const isSelected = selected === option.id;
          const showResult = selected !== null;
          return (
            <button
              key={option.id}
              type="button"
              disabled={selected !== null}
              onClick={() => {
                if (selected) return;
                setSelected(option.id);
                onAnswer(option.id, option.isCorrect, Date.now() - startedAt);
              }}
              className={cn(
                "font-jp flex items-center justify-between gap-2 rounded-lg border border-border px-4 py-3 text-left text-base transition-colors",
                !showResult && "hover:border-accent/60 hover:bg-secondary/50",
                showResult && option.isCorrect && "border-success bg-success/10",
                showResult && isSelected && !option.isCorrect && "border-destructive bg-destructive/10",
                showResult && !isSelected && !option.isCorrect && "opacity-60"
              )}
            >
              <span>{option.label}</span>
              {showResult && option.isCorrect && <Check className="size-4 text-success" />}
              {showResult && isSelected && !option.isCorrect && <X className="size-4 text-destructive" />}
            </button>
          );
        })}
      </div>

      {selected && (
        <p className="rounded-md bg-secondary/60 px-3 py-2 text-sm text-muted-foreground">{question.explanation}</p>
      )}
    </Card>
  );
}
