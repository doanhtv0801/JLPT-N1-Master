"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell } from "recharts";

interface MasteryDistributionChartProps {
  data: { status: string; count: number }[];
}

const COLORS: Record<string, string> = {
  Unseen: "var(--color-mastery-0)",
  Learning: "var(--color-mastery-low)",
  Young: "var(--color-mastery-mid)",
  Mature: "var(--color-mastery-high)",
  Mastered: "var(--color-mastery-complete)",
};

export default function MasteryDistributionChart({ data }: MasteryDistributionChartProps) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
        <XAxis dataKey="status" tick={{ fontSize: 12 }} stroke="var(--color-muted-foreground)" />
        <YAxis tick={{ fontSize: 11 }} width={36} stroke="var(--color-muted-foreground)" />
        <Tooltip
          contentStyle={{
            background: "var(--color-popover)",
            border: "1px solid var(--color-border)",
            borderRadius: 8,
            fontSize: 12,
          }}
        />
        <Bar dataKey="count" radius={[4, 4, 0, 0]}>
          {data.map((d) => (
            <Cell key={d.status} fill={COLORS[d.status] ?? "var(--color-muted)"} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
