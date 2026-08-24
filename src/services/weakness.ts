import { MASTERY_DIMENSION_KEYS, MASTERY_DIMENSION_LABELS } from "@/types/mastery";
import type { MasteryDimensions } from "@/types/mastery";
import type { WeaknessScore } from "@/types/statistics";

export function classifyScore(score: number): WeaknessScore["classification"] {
  if (score >= 92) return "mastered";
  if (score >= 80) return "strong";
  if (score >= 65) return "improving";
  if (score >= 45) return "weak";
  return "critical";
}

/**
 * Turn per-dimension mastery averages into ranked WeaknessScore rows for the
 * dashboard and (in a later phase) the dedicated Weakness Engine page.
 */
export function computeDimensionWeaknesses(
  averages: MasteryDimensions,
  sampleSize: number
): WeaknessScore[] {
  return MASTERY_DIMENSION_KEYS.map((key) => ({
    category: key,
    label: MASTERY_DIMENSION_LABELS[key],
    score: Math.round(averages[key]),
    classification: classifyScore(averages[key]),
    sampleSize,
  })).sort((a, b) => a.score - b.score);
}

export function weakestAndStrongest(weaknesses: WeaknessScore[]): {
  weakest: WeaknessScore | null;
  strongest: WeaknessScore | null;
} {
  if (weaknesses.length === 0) return { weakest: null, strongest: null };
  const sorted = [...weaknesses].sort((a, b) => a.score - b.score);
  return { weakest: sorted[0], strongest: sorted[sorted.length - 1] };
}
