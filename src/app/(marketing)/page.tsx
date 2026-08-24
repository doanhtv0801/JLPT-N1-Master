import Link from "next/link";
import { ArrowRight, Layers, Brain, Swords, Target, BookOpen, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { VOCABULARY_CORPUS_SIZE } from "@/data/vocabulary";

const FEATURES = [
  {
    icon: Layers,
    title: "Vocabulary Mastery, Not Flashcards",
    description:
      "Every word is tracked across seven dimensions — reading, meaning, context, synonyms, collocation and production — not a single learned/not-learned flag.",
  },
  {
    icon: Brain,
    title: "Smart SRS",
    description:
      "A stability-and-difficulty scheduler in the spirit of FSRS decides what to review, and which specific skill on that word needs it most.",
  },
  {
    icon: Swords,
    title: "Synonym & Nuance Practice",
    description:
      "Distinguish 促進 from 推進, 対応 from 適応 — the confusable clusters that separate N1 passers from N1 masters.",
  },
  {
    icon: Target,
    title: "Weakness-Aware Practice",
    description:
      "The dashboard always tells you what to learn next, what to review, and exactly where you're weakest.",
  },
  {
    icon: BookOpen,
    title: "Built to Grow",
    description:
      "Vocabulary today, with an architecture ready for Kanji, Grammar, Reading, Listening and full Mock Tests.",
  },
  {
    icon: Trophy,
    title: "180 Project",
    description:
      "An internal, heuristic score estimate keeps your eyes on the real target: not just passing, but 180 out of 180.",
  },
];

export default function LandingPage() {
  return (
    <div>
      <section className="mx-auto flex max-w-5xl flex-col items-center gap-6 px-4 pt-20 pb-16 text-center md:pt-28">
        <span className="rounded-full border border-border px-3 py-1 text-xs font-medium text-muted-foreground">
          An internal JLPT N1 mastery corpus — {VOCABULARY_CORPUS_SIZE} words and growing
        </span>
        <h1 className="text-4xl font-semibold tracking-tight text-balance md:text-6xl">
          Master Japanese.
          <br />
          Aim for 180/180.
        </h1>
        <p className="max-w-2xl text-balance text-lg text-muted-foreground">
          JLPT N1 Master is a mastery operating system for advanced Japanese — built to take you from
          recognizing a word to actually using it, correctly, in context.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Button asChild size="lg">
            <Link href="/dashboard">
              Start Learning <ArrowRight className="size-4" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/dashboard">View Demo</Link>
          </Button>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl grid-cols-1 gap-4 px-4 pb-20 md:grid-cols-2 md:px-8 lg:grid-cols-3">
        {FEATURES.map((f) => (
          <Card key={f.title} className="gap-3">
            <f.icon className="size-5 text-accent" />
            <h3 className="font-medium">{f.title}</h3>
            <p className="text-sm text-muted-foreground">{f.description}</p>
          </Card>
        ))}
      </section>

      <section className="border-t border-border bg-secondary/30 py-16">
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-6 px-4 text-center">
          <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
            Don&apos;t just pass N1.
            <br />
            Master it.
          </h2>
          <Button asChild size="lg">
            <Link href="/dashboard">
              Start Learning <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
