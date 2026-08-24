"use client";

import { useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { MasteryRing } from "./mastery-ring";
import type { VocabularyEntry, UserVocabulary } from "@/types";
import { formatDistanceToNow } from "date-fns";

interface VocabularyRowProps {
  vocab: VocabularyEntry;
  userVocab?: UserVocabulary;
  index: number;
}

const STATUS_LABEL: Record<string, string> = {
  unseen: "Not learned",
  learning: "Learning",
  young: "Young",
  mature: "Mature",
  mastered: "Mastered",
};

export function VocabularyRow({ vocab, userVocab, index }: VocabularyRowProps) {
  const [now] = useState(() => Date.now());
  const status = userVocab?.status ?? "unseen";
  const isDue = userVocab && new Date(userVocab.srs.nextReviewAt).getTime() <= now && status !== "unseen";

  return (
    <Link
      href={`/vocabulary/${vocab.id}`}
      className="grid grid-cols-[auto_1fr_auto_auto_auto_auto] items-center gap-4 rounded-md px-3 py-2.5 text-sm transition-colors hover:bg-secondary/60 sm:grid-cols-[auto_2fr_1fr_auto_auto_auto_auto]"
    >
      <span className="w-6 shrink-0 text-right text-xs tabular-nums text-muted-foreground">{index}</span>
      <div className="flex min-w-0 items-baseline gap-2">
        <span className="font-jp shrink-0 text-lg">{vocab.word}</span>
        <span className="truncate text-muted-foreground">{vocab.reading}</span>
      </div>
      <span className="hidden truncate text-muted-foreground sm:block">{vocab.meaningEn[0]}</span>
      <Badge variant="outline" className="justify-self-end">
        {vocab.jlptLevel}
      </Badge>
      <span className="justify-self-end text-xs text-muted-foreground">{vocab.frequencyScore}</span>
      <MasteryRing value={userVocab?.overallMastery ?? 0} size={36} className="justify-self-end" />
      <span className="hidden justify-self-end text-xs text-muted-foreground sm:block">
        {status === "unseen"
          ? "—"
          : isDue
            ? "Due now"
            : `${STATUS_LABEL[status]} · ${formatDistanceToNow(new Date(userVocab!.srs.nextReviewAt), { addSuffix: true })}`}
      </span>
    </Link>
  );
}
