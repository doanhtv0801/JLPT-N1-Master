import {
  DEFAULT_MASTERY_WEIGHTS,
  MASTERY_DIMENSION_KEYS,
  MasteryLevel,
  type MasteryDimensionKey,
  type MasteryDimensions,
  type MasteryWeights,
} from "@/types/mastery";
import type { VocabularyStatus } from "@/types/vocabulary";
import { clamp } from "@/lib/utils";

/** A dimension counts as "known" once it crosses this bar. */
export const DIMENSION_KNOWN_THRESHOLD = 70;
/** Every dimension (including collocation) must clear this bar to count as truly Mastered. */
export const MASTERY_COMPLETE_THRESHOLD = 80;

/**
 * Combine the six mastery dimensions into a single 0-100 "overall mastery"
 * score using weighted averaging. Production and synonym-distinction carry
 * the most weight — see DEFAULT_MASTERY_WEIGHTS for the rationale.
 */
export function computeOverallMastery(
  dimensions: MasteryDimensions,
  weights: MasteryWeights = DEFAULT_MASTERY_WEIGHTS
): number {
  const totalWeight = MASTERY_DIMENSION_KEYS.reduce((sum, key) => sum + weights[key], 0);
  const weightedSum = MASTERY_DIMENSION_KEYS.reduce(
    (sum, key) => sum + dimensions[key] * weights[key],
    0
  );
  return clamp(Math.round(weightedSum / totalWeight), 0, 100);
}

/**
 * Determine the discrete 0-7 mastery level from the dimension scores.
 * Levels are strictly sequential (per spec section 11): a word cannot be
 * "Synonyms Distinguished" without its reading, meaning and context already
 * being known. This intentionally prevents lucky guessing on a later step
 * from inflating the displayed level while earlier fundamentals are weak.
 */
export function computeMasteryLevel(
  dimensions: MasteryDimensions,
  hasBeenSeen: boolean
): MasteryLevel {
  if (!hasBeenSeen) return MasteryLevel.Unseen;
  if (dimensions.reading < DIMENSION_KNOWN_THRESHOLD) return MasteryLevel.Recognized;
  if (dimensions.meaning < DIMENSION_KNOWN_THRESHOLD) return MasteryLevel.ReadingKnown;
  if (dimensions.context < DIMENSION_KNOWN_THRESHOLD) return MasteryLevel.MeaningKnown;
  if (dimensions.synonym < DIMENSION_KNOWN_THRESHOLD) return MasteryLevel.ContextUnderstood;
  if (dimensions.production < DIMENSION_KNOWN_THRESHOLD) return MasteryLevel.SynonymsDistinguished;
  const overall = computeOverallMastery(dimensions);
  const allDimensionsStrong = MASTERY_DIMENSION_KEYS.every(
    (key) => dimensions[key] >= MASTERY_COMPLETE_THRESHOLD
  );
  if (overall >= 90 && allDimensionsStrong) return MasteryLevel.Mastered;
  return MasteryLevel.CanProduce;
}

export function levelToStatus(level: MasteryLevel): VocabularyStatus {
  if (level === MasteryLevel.Unseen) return "unseen";
  if (level <= MasteryLevel.ReadingKnown) return "learning";
  if (level <= MasteryLevel.ContextUnderstood) return "young";
  if (level <= MasteryLevel.CanProduce) return "mature";
  return "mastered";
}

/**
 * Update a single mastery dimension after a quiz/review answer.
 *
 * Correct answers move the score a fraction of the way toward 100 (so gains
 * shrink as the learner approaches true mastery — the last 10% is the
 * hardest to earn, by design). Incorrect answers apply a proportional-plus-
 * fixed penalty, so a mistake on an already-fragile dimension hurts more
 * than a slip on a well-established one relative to where it started, while
 * a single mistake can never be catastrophic.
 */
export function updateDimension(current: number, correct: boolean): number {
  if (correct) {
    const gain = (100 - current) * 0.32;
    return clamp(Math.round(current + gain), 0, 100);
  }
  const loss = current * 0.35 + 8;
  return clamp(Math.round(current - loss), 0, 100);
}

export function updateMastery(
  current: MasteryDimensions,
  dimension: MasteryDimensionKey,
  correct: boolean
): MasteryDimensions {
  return {
    ...current,
    [dimension]: updateDimension(current[dimension], correct),
  };
}

/** Small, universal nudge applied to every dimension the first time a word is learned. */
export function applyInitialExposure(dimensions: MasteryDimensions): MasteryDimensions {
  return {
    reading: updateDimension(dimensions.reading, true),
    meaning: updateDimension(dimensions.meaning, true),
    context: dimensions.context,
    synonym: dimensions.synonym,
    collocation: dimensions.collocation,
    production: dimensions.production,
  };
}
