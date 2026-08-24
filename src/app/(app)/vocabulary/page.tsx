"use client";

import { useMemo, useState } from "react";
import { LayoutGrid, List, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { VocabularyCard } from "@/components/features/vocabulary-card";
import { VocabularyRow } from "@/components/features/vocabulary-row";
import { VOCABULARY } from "@/data/vocabulary";
import { ALL_TOPICS, TOPIC_LABELS } from "@/data/topics";
import { useLearningStore } from "@/lib/store/learning-store";
import { isDue } from "@/services/srs";
import type { VocabularyStatus } from "@/types";

type SortKey = "frequency" | "difficulty" | "mastery" | "alphabetical";
type StatusFilter = "all" | VocabularyStatus | "due";

const PAGE_SIZE = 20;

export default function VocabularyExplorerPage() {
  const userVocabulary = useLearningStore((s) => s.userVocabulary);
  const [query, setQuery] = useState("");
  const [topic, setTopic] = useState<string>("all");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [sort, setSort] = useState<SortKey>("frequency");
  const [view, setView] = useState<"table" | "card">("table");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    let list = VOCABULARY.filter((v) => {
      const uv = userVocabulary[v.id];
      if (topic !== "all" && !v.topics.includes(topic as (typeof v.topics)[number])) return false;
      if (status === "due" && !(uv && isDue(uv.srs) && uv.status !== "unseen")) return false;
      if (status !== "all" && status !== "due" && (uv?.status ?? "unseen") !== status) return false;
      if (query.trim()) {
        const q = query.toLowerCase();
        const match =
          v.word.includes(query) ||
          v.reading.includes(query) ||
          v.romaji.toLowerCase().includes(q) ||
          v.meaningEn.some((m) => m.toLowerCase().includes(q)) ||
          v.meaningVi.some((m) => m.toLowerCase().includes(q));
        if (!match) return false;
      }
      return true;
    });

    list = [...list].sort((a, b) => {
      if (sort === "frequency") return b.frequencyScore - a.frequencyScore;
      if (sort === "difficulty") return a.difficulty - b.difficulty;
      if (sort === "alphabetical") return a.reading.localeCompare(b.reading);
      const am = userVocabulary[a.id]?.overallMastery ?? 0;
      const bm = userVocabulary[b.id]?.overallMastery ?? 0;
      return bm - am;
    });

    return list;
  }, [query, topic, status, sort, userVocabulary]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function updateFilter<T>(setter: (v: T) => void, value: T) {
    setter(value);
    setPage(1);
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-5">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Vocabulary Explorer</h1>
        <p className="text-sm text-muted-foreground">{filtered.length} words match your filters</p>
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by kanji, reading, or meaning..."
            className="pl-9"
            value={query}
            onChange={(e) => updateFilter(setQuery, e.target.value)}
          />
        </div>

        <Select value={topic} onValueChange={(v) => updateFilter(setTopic, v)}>
          <SelectTrigger className="w-full md:w-44"><SelectValue placeholder="Topic" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All topics</SelectItem>
            {ALL_TOPICS.map((t) => (
              <SelectItem key={t} value={t}>{TOPIC_LABELS[t]}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={status} onValueChange={(v) => updateFilter(setStatus, v as StatusFilter)}>
          <SelectTrigger className="w-full md:w-40"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="unseen">Not learned</SelectItem>
            <SelectItem value="learning">Learning</SelectItem>
            <SelectItem value="young">Young</SelectItem>
            <SelectItem value="mature">Mature</SelectItem>
            <SelectItem value="mastered">Mastered</SelectItem>
            <SelectItem value="due">Due for review</SelectItem>
          </SelectContent>
        </Select>

        <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
          <SelectTrigger className="w-full md:w-40"><SelectValue placeholder="Sort" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="frequency">Frequency</SelectItem>
            <SelectItem value="difficulty">Difficulty</SelectItem>
            <SelectItem value="mastery">Mastery</SelectItem>
            <SelectItem value="alphabetical">Alphabetical</SelectItem>
          </SelectContent>
        </Select>

        <Tabs value={view} onValueChange={(v) => setView(v as "table" | "card")}>
          <TabsList>
            <TabsTrigger value="table" aria-label="Table view"><List className="size-4" /></TabsTrigger>
            <TabsTrigger value="card" aria-label="Card view"><LayoutGrid className="size-4" /></TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border py-16 text-center">
          <p className="text-sm text-muted-foreground">No words match these filters.</p>
          <Button variant="outline" size="sm" onClick={() => { setQuery(""); setTopic("all"); setStatus("all"); }}>
            Clear filters
          </Button>
        </div>
      ) : view === "table" ? (
        <div className="flex flex-col divide-y divide-border rounded-lg border border-border">
          {pageItems.map((v, i) => (
            <VocabularyRow
              key={v.id}
              vocab={v}
              userVocab={userVocabulary[v.id]}
              index={(page - 1) * PAGE_SIZE + i + 1}
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {pageItems.map((v, i) => (
            <VocabularyCard
              key={v.id}
              vocab={v}
              userVocab={userVocabulary[v.id]}
              index={(page - 1) * PAGE_SIZE + i + 1}
            />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
