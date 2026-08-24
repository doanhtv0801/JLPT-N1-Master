"use client";

import { use } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Bookmark, AlertTriangle, ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { AudioButton } from "@/components/features/audio-button";
import { MasteryRing } from "@/components/features/mastery-ring";
import { MasteryBar } from "@/components/features/mastery-bar";
import { getVocabularyById } from "@/data/vocabulary";
import { TOPIC_LABELS } from "@/data/topics";
import { useLearningStore } from "@/lib/store/learning-store";
import { MASTERY_DIMENSION_KEYS, MASTERY_DIMENSION_LABELS, MASTERY_LEVEL_LABELS } from "@/types/mastery";
import { cn } from "@/lib/utils";

export default function VocabularyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const vocab = getVocabularyById(id);
  const userVocabulary = useLearningStore((s) => s.userVocabulary);
  const toggleBookmark = useLearningStore((s) => s.toggleBookmark);
  const toggleDifficult = useLearningStore((s) => s.toggleDifficult);

  if (!vocab) notFound();

  const uv = userVocabulary[id];
  const mastery = uv?.mastery ?? { reading: 0, meaning: 0, context: 0, synonym: 0, collocation: 0, production: 0 };
  const overall = uv?.overallMastery ?? 0;
  const level = uv?.masteryLevel ?? 0;

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <Link href="/vocabulary" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Back to Vocabulary Explorer
      </Link>

      <Card>
        <CardContent className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div>
              <div className="flex items-baseline gap-3">
                <h1 className="font-jp text-5xl font-medium">{vocab.word}</h1>
                <AudioButton text={vocab.word} />
              </div>
              <p className="mt-1 text-lg text-muted-foreground">{vocab.reading}</p>
              <p className="text-sm text-muted-foreground">{vocab.romaji}</p>
              <div className="mt-3 flex flex-wrap items-center gap-1.5">
                {vocab.partOfSpeech.map((p) => (
                  <Badge key={p} variant="secondary" className="capitalize">{p.replace("-", " ")}</Badge>
                ))}
                <Badge variant="outline">{vocab.jlptLevel}</Badge>
                <Badge variant="muted">Frequency {vocab.frequencyScore}</Badge>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:flex-col sm:items-end">
            <MasteryRing value={overall} size={80} label={MASTERY_LEVEL_LABELS[level as keyof typeof MASTERY_LEVEL_LABELS]} />
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                aria-label="Bookmark"
                onClick={() => toggleBookmark(vocab.id)}
                className={cn(uv?.bookmarked && "border-accent text-accent")}
              >
                <Bookmark className={cn("size-4", uv?.bookmarked && "fill-accent")} />
              </Button>
              <Button
                variant="outline"
                size="icon"
                aria-label="Mark difficult"
                onClick={() => toggleDifficult(vocab.id)}
                className={cn(uv?.markedDifficult && "border-warning text-warning")}
              >
                <AlertTriangle className="size-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Meaning</CardTitle></CardHeader>
          <CardContent className="flex flex-col gap-2">
            <ul className="list-inside list-disc text-sm">
              {vocab.meaningEn.map((m) => <li key={m}>{m}</li>)}
            </ul>
            {vocab.meaningVi.length > 0 && (
              <p className="text-sm text-muted-foreground">{vocab.meaningVi.join(", ")}</p>
            )}
            <Separator className="my-1" />
            <p className="font-jp text-sm text-muted-foreground">{vocab.definitionJa}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Mastery Breakdown</CardTitle></CardHeader>
          <CardContent className="flex flex-col gap-3">
            {MASTERY_DIMENSION_KEYS.map((key) => (
              <MasteryBar key={key} label={MASTERY_DIMENSION_LABELS[key]} value={mastery[key]} />
            ))}
          </CardContent>
        </Card>
      </div>

      {vocab.examples.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Example</CardTitle></CardHeader>
          <CardContent className="flex flex-col gap-4">
            {vocab.examples.map((ex) => (
              <div key={ex.id} className="flex flex-col gap-1">
                <div className="flex items-start gap-2">
                  <p className="font-jp text-lg leading-relaxed">{ex.japanese}</p>
                  <AudioButton text={ex.japanese} size="sm" />
                </div>
                <p className="text-sm text-muted-foreground">{ex.translationEn}</p>
                {ex.translationVi && <p className="text-sm text-muted-foreground">{ex.translationVi}</p>}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {vocab.collocations.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Collocations</CardTitle></CardHeader>
          <CardContent className="flex flex-col gap-2">
            {vocab.collocations.map((c) => (
              <div key={c.id} className="flex items-center justify-between text-sm">
                <span className="font-jp">{c.phrase}</span>
                <span className="text-muted-foreground">{c.translationEn}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {vocab.synonyms.length > 0 && (
          <Card>
            <CardHeader><CardTitle>Synonyms</CardTitle></CardHeader>
            <CardContent className="flex flex-col gap-3">
              {vocab.synonyms.map((s) => (
                <div key={s.vocabularyId} className="flex flex-col gap-1 rounded-md bg-secondary/50 p-3">
                  <Link href={`/vocabulary/${s.vocabularyId}`} className="font-jp font-medium hover:underline">
                    {s.word} ({s.reading})
                  </Link>
                  {s.nuance && <p className="text-xs text-muted-foreground">{s.nuance}</p>}
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {vocab.confusingWords.length > 0 && (
          <Card>
            <CardHeader><CardTitle>Similar / Confusing Words</CardTitle></CardHeader>
            <CardContent className="flex flex-col gap-3">
              {vocab.confusingWords.map((c) => (
                <div key={c.vocabularyId} className="flex flex-col gap-1 rounded-md bg-secondary/50 p-3">
                  <Link href={`/vocabulary/${c.vocabularyId}`} className="font-jp font-medium hover:underline">
                    {vocab.word} vs {c.word}
                  </Link>
                  <p className="text-xs text-muted-foreground">{c.distinction}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {vocab.antonyms.length > 0 && (
          <Card>
            <CardHeader><CardTitle>Antonyms</CardTitle></CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {vocab.antonyms.map((a) => (
                <Link key={a.vocabularyId} href={`/vocabulary/${a.vocabularyId}`}>
                  <Badge variant="outline" className="font-jp">{a.word}</Badge>
                </Link>
              ))}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader><CardTitle>Kanji</CardTitle></CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {vocab.kanji.map((k) => (
              <span key={k} className="font-jp flex size-11 items-center justify-center rounded-md border border-border text-xl">
                {k}
              </span>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Topics</CardTitle></CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {vocab.topics.map((t) => (
            <Badge key={t} variant="muted">{TOPIC_LABELS[t]}</Badge>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
