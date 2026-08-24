"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { VOCABULARY } from "@/data/vocabulary";
import { BookOpen, LayoutDashboard, RefreshCcw, BarChart3 } from "lucide-react";

const FEATURE_LINKS = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Vocabulary Explorer", href: "/vocabulary", icon: BookOpen },
  { label: "Review", href: "/review", icon: RefreshCcw },
  { label: "Statistics", href: "/statistics", icon: BarChart3 },
];

export function SearchCommand() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const router = useRouter();

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((v) => !v);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  const results = useMemo(() => {
    if (!query.trim()) return VOCABULARY.slice(0, 6);
    const q = query.toLowerCase();
    return VOCABULARY.filter(
      (v) =>
        v.word.includes(query) ||
        v.reading.includes(query) ||
        v.romaji.toLowerCase().includes(q) ||
        v.meaningEn.some((m) => m.toLowerCase().includes(q)) ||
        v.meaningVi.some((m) => m.toLowerCase().includes(q))
    ).slice(0, 8);
  }, [query]);

  function go(href: string) {
    setOpen(false);
    setQuery("");
    router.push(href);
  }

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Search vocabulary, kanji, features..." value={query} onValueChange={setQuery} />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Vocabulary">
          {results.map((v) => (
            <CommandItem key={v.id} value={v.word} onSelect={() => go(`/vocabulary/${v.id}`)}>
              <span className="font-jp text-base">{v.word}</span>
              <span className="text-muted-foreground">{v.reading}</span>
              <span className="ml-auto truncate text-xs text-muted-foreground">{v.meaningEn[0]}</span>
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandGroup heading="Go to">
          {FEATURE_LINKS.map((f) => (
            <CommandItem key={f.href} value={f.label} onSelect={() => go(f.href)}>
              <f.icon className="size-4" />
              {f.label}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
