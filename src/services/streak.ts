import { daysBetween, toDateKey } from "@/lib/utils";

/**
 * Compute current + longest study streak from the set of dates (YYYY-MM-DD)
 * on which any activity was recorded. "Current streak" tolerates today not
 * having activity yet (it still counts yesterday's streak as live) so the
 * dashboard doesn't zero out a streak the moment midnight passes before the
 * learner has studied today.
 */
export function computeStreaks(
  activeDateKeys: string[],
  todayKey: string = toDateKey(new Date())
): { current: number; longest: number } {
  const uniqueSorted = Array.from(new Set(activeDateKeys)).sort();
  if (uniqueSorted.length === 0) return { current: 0, longest: 0 };

  let longest = 1;
  let run = 1;
  for (let i = 1; i < uniqueSorted.length; i++) {
    const gap = daysBetween(uniqueSorted[i - 1], uniqueSorted[i]);
    if (gap === 1) {
      run += 1;
    } else if (gap > 1) {
      run = 1;
    }
    longest = Math.max(longest, run);
  }

  const lastActive = uniqueSorted[uniqueSorted.length - 1];
  const gapToToday = daysBetween(lastActive, todayKey);
  let current = 0;
  if (gapToToday <= 1) {
    // Walk backward from the most recent active day counting the run.
    current = 1;
    for (let i = uniqueSorted.length - 1; i > 0; i--) {
      const gap = daysBetween(uniqueSorted[i - 1], uniqueSorted[i]);
      if (gap === 1) current += 1;
      else break;
    }
  }

  return { current, longest };
}
