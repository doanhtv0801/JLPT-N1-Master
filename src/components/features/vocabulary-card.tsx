import Link from "next/link";
import { Bookmark } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MasteryRing } from "./mastery-ring";
import type { VocabularyEntry, UserVocabulary } from "@/types";
import { cn } from "@/lib/utils";

interface VocabularyCardProps {
  vocab: VocabularyEntry;
  userVocab?: UserVocabulary;
  index?: number;
}

export function VocabularyCard({ vocab, userVocab, index }: VocabularyCardProps) {
  const overall = userVocab?.overallMastery ?? 0;
  return (
    <Link href={`/vocabulary/${vocab.id}`}>
      <Card className="h-full gap-3 transition-colors hover:border-accent/50">
        <div className="flex items-start justify-between gap-2">
          <div>
            {index !== undefined && (
              <p className="text-xs tabular-nums text-muted-foreground">No. {index}</p>
            )}
            <p className="font-jp text-2xl font-medium leading-tight">{vocab.word}</p>
            <p className="text-sm text-muted-foreground">{vocab.reading}</p>
          </div>
          <MasteryRing value={overall} size={44} />
        </div>
        <p className="line-clamp-2 text-sm text-muted-foreground">{vocab.meaningEn.join("; ")}</p>
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge variant="outline">{vocab.jlptLevel}</Badge>
          {vocab.topics.slice(0, 2).map((t) => (
            <Badge key={t} variant="muted" className="capitalize">
              {t.replace("-", " ")}
            </Badge>
          ))}
          {userVocab?.bookmarked && (
            <Bookmark className={cn("ml-auto size-3.5 fill-accent text-accent")} />
          )}
        </div>
      </Card>
    </Link>
  );
}
