"use client";

import { useState } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { DailyActivity } from "@/types";
import { toDateKey } from "@/lib/utils";

interface XpTrendChartProps {
  activity: Record<string, DailyActivity>;
  days?: number;
}

export default function XpTrendChart({ activity, days = 30 }: XpTrendChartProps) {
  const [now] = useState(() => Date.now());
  const data = Array.from({ length: days }, (_, i) => {
    const date = toDateKey(new Date(now - (days - 1 - i) * 86_400_000));
    const entry = activity[date];
    return {
      date: date.slice(5),
      xp: entry?.xpEarned ?? 0,
    };
  });

  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="xpGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-accent)" stopOpacity={0.35} />
            <stop offset="100%" stopColor="var(--color-accent)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
        <XAxis dataKey="date" tick={{ fontSize: 11 }} interval={Math.floor(days / 6)} stroke="var(--color-muted-foreground)" />
        <YAxis tick={{ fontSize: 11 }} width={36} stroke="var(--color-muted-foreground)" />
        <Tooltip
          contentStyle={{
            background: "var(--color-popover)",
            border: "1px solid var(--color-border)",
            borderRadius: 8,
            fontSize: 12,
          }}
        />
        <Area type="monotone" dataKey="xp" stroke="var(--color-accent)" fill="url(#xpGradient)" strokeWidth={2} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
