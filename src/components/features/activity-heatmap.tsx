"use client";

import { useMemo, useState } from "react";
import { cn, toDateKey } from "@/lib/utils";
import type { DailyActivity } from "@/types";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ActivityHeatmapProps {
  activity: Record<string, DailyActivity>;
}

const RANGE_OPTIONS = [
  { value: "7", label: "7 days" },
  { value: "30", label: "30 days" },
  { value: "90", label: "90 days" },
  { value: "365", label: "1 year" },
] as const;

function intensityClass(xp: number): string {
  if (xp <= 0) return "bg-muted";
  if (xp < 150) return "bg-accent/25";
  if (xp < 350) return "bg-accent/50";
  if (xp < 600) return "bg-accent/75";
  return "bg-accent";
}

export function ActivityHeatmap({ activity }: ActivityHeatmapProps) {
  const [range, setRange] = useState<string>("90");

  const days = useMemo(() => {
    const count = Number(range);
    const today = new Date();
    const list: { date: string; xp: number; reviews: number }[] = [];
    for (let i = count - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = toDateKey(d);
      const entry = activity[key];
      list.push({ date: key, xp: entry?.xpEarned ?? 0, reviews: entry?.reviewsCompleted ?? 0 });
    }
    // Pad to a multiple of 7 so weeks align into full columns.
    const padCount = (7 - (list.length % 7)) % 7;
    const padded = Array.from({ length: padCount }, () => ({ date: "", xp: -1, reviews: 0 })).concat(list);
    return padded;
  }, [range, activity]);

  const weeks: typeof days[] = [];
  for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7));

  return (
    <div className="flex flex-col gap-3">
      <Tabs value={range} onValueChange={setRange}>
        <TabsList>
          {RANGE_OPTIONS.map((opt) => (
            <TabsTrigger key={opt.value} value={opt.value} className="text-xs">
              {opt.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-thin">
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-1">
            {week.map((day, di) =>
              day.xp === -1 ? (
                <div key={di} className="size-3 rounded-sm" />
              ) : (
                <Tooltip key={di}>
                  <TooltipTrigger asChild>
                    <div className={cn("size-3 rounded-sm", intensityClass(day.xp))} />
                  </TooltipTrigger>
                  <TooltipContent>
                    {day.date}: {day.xp} XP · {day.reviews} reviews
                  </TooltipContent>
                </Tooltip>
              )
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
