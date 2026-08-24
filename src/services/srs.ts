import type { MasteryDimensionKey, MasteryDimensions } from "@/types/mastery";
import type { ReviewGrade, SrsState } from "@/types/srs";
import type { QuestionType } from "@/types/quiz";
import { QUESTION_TYPE_DIMENSION } from "@/types/quiz";
import { MASTERY_DIMENSION_KEYS } from "@/types/mastery";
import { clamp } from "@/lib/utils";

/**
 * A lightweight scheduler in the spirit of FSRS (Free Spaced Repetition
 * Scheduler): stability grows multiplicatively on success and collapses on
 * lapse, difficulty drifts toward how hard the word has been to recall, and
 * "due" is driven by comparing estimated retrievability against a target
 * retention rate — rather than a fixed Leitner interval table.
 *
 * This is intentionally simplified relative to full FSRS (no per-user
 * parameter fitting), but the shape of the abstraction (difficulty,
 * stability, retrievability as first-class fields) is what would let a real
 * FSRS implementation, or a learned model, drop in later without touching
 * callers.
 */

const MIN_STABILITY_DAYS = 0.5;
const MAX_STABILITY_DAYS = 400;
/** Target probability of recall we schedule the next review around. */
export const TARGET_RETENTION = 0.9;

const GRADE_STABILITY_MULTIPLIER: Record<ReviewGrade, number> = {
  again: 0.4,
  hard: 1.15,
  good: 2.2,
  easy: 3.6,
};

const GRADE_DIFFICULTY_DELTA: Record<ReviewGrade, number> = {
  again: 1,
  hard: 0.25,
  good: -0.1,
  easy: -0.5,
};

const GRADE_POST_REVIEW_RETRIEVABILITY: Record<ReviewGrade, number> = {
  again: 0.3,
  hard: 0.65,
  good: 0.88,
  easy: 0.97,
};

/**
 * Estimated probability of recall `elapsedDays` after the last review, given
 * stability `stabilityDays`. Approximates the FSRS forgetting curve:
 * R(t, S) = (1 + t / (9 * S)) ^ -1
 */
export function estimateRetrievability(elapsedDays: number, stabilityDays: number): number {
  if (elapsedDays <= 0) return 1;
  const s = Math.max(stabilityDays, 0.1);
  return clamp(1 / (1 + elapsedDays / (9 * s)), 0, 1);
}

export function getCurrentRetrievability(srs: SrsState, now: Date = new Date()): number {
  if (!srs.lastReviewedAt) return 1;
  const elapsedDays = (now.getTime() - new Date(srs.lastReviewedAt).getTime()) / 86_400_000;
  return estimateRetrievability(elapsedDays, srs.stability);
}

export function isDue(srs: SrsState, now: Date = new Date()): boolean {
  return new Date(srs.nextReviewAt).getTime() <= now.getTime();
}

/**
 * Advance SRS state after a review. `difficultyPenalty` (0-1) lets callers
 * factor in *which* mastery dimension was being tested — missing a
 * synonym-distinction question is treated as a smaller SRS setback than
 * forgetting the reading outright, since the word itself is still "known".
 */
export function scheduleNextReview(
  srs: SrsState,
  grade: ReviewGrade,
  now: Date = new Date()
): SrsState {
  const isLapse = grade === "again";

  const newDifficulty = clamp(srs.difficulty + GRADE_DIFFICULTY_DELTA[grade], 1, 10);

  let newStability: number;
  if (isLapse) {
    newStability = Math.max(MIN_STABILITY_DAYS, srs.stability * GRADE_STABILITY_MULTIPLIER.again);
  } else {
    // Harder words (higher difficulty) grow stability more slowly per success.
    const difficultyDamping = 1 - (newDifficulty - 1) / 18; // 1.0 (easy) .. ~0.5 (hardest)
    newStability = clamp(
      srs.stability * GRADE_STABILITY_MULTIPLIER[grade] * difficultyDamping,
      MIN_STABILITY_DAYS,
      MAX_STABILITY_DAYS
    );
  }

  const nextReviewAt = new Date(now.getTime() + newStability * 86_400_000).toISOString();

  return {
    difficulty: newDifficulty,
    stability: newStability,
    retrievability: GRADE_POST_REVIEW_RETRIEVABILITY[grade],
    lastReviewedAt: now.toISOString(),
    nextReviewAt,
    reviewCount: srs.reviewCount + 1,
    correctCount: srs.correctCount + (isLapse ? 0 : 1),
    incorrectCount: srs.incorrectCount + (isLapse ? 1 : 0),
    lapseCount: srs.lapseCount + (isLapse ? 1 : 0),
  };
}

/** Maps a raw correct/incorrect quiz answer onto an SRS grade. */
export function gradeFromAnswer(correct: boolean, responseTimeMs: number): ReviewGrade {
  if (!correct) return "again";
  if (responseTimeMs < 2500) return "easy";
  if (responseTimeMs < 6000) return "good";
  return "hard";
}

/**
 * Pick which mastery dimension (and therefore which question type) most
 * needs reinforcement for this word right now. This is the core of "smart"
 * review: a word with meaning=100/reading=100/synonym=45 should be quizzed
 * on synonyms next, not asked "what does this word mean?" again.
 */
export function weakestDimension(mastery: MasteryDimensions): MasteryDimensionKey {
  return MASTERY_DIMENSION_KEYS.reduce((weakest, key) =>
    mastery[key] < mastery[weakest] ? key : weakest
  );
}

const DIMENSION_TO_QUESTION_TYPES: Record<MasteryDimensionKey, QuestionType[]> = {
  reading: ["reading"],
  meaning: ["meaning"],
  context: ["context"],
  synonym: ["synonym", "confusing-word"],
  collocation: ["collocation"],
  production: ["production"],
};

/** Given a word's mastery profile, choose the most useful question type to ask next. */
export function selectQuestionType(
  mastery: MasteryDimensions,
  hasSynonyms: boolean,
  hasConfusingWords: boolean,
  hasCollocations: boolean
): QuestionType {
  const weak = weakestDimension(mastery);
  const candidates = DIMENSION_TO_QUESTION_TYPES[weak];
  const viable = candidates.filter((type) => {
    if (type === "synonym" && !hasSynonyms) return false;
    if (type === "confusing-word" && !hasConfusingWords) return false;
    if (type === "collocation" && !hasCollocations) return false;
    return true;
  });
  if (viable.length > 0) return viable[Math.floor(Math.random() * viable.length)];
  // Fall back to meaning, which every word supports.
  return "meaning";
}

export function dimensionForQuestionType(type: QuestionType): MasteryDimensionKey {
  return QUESTION_TYPE_DIMENSION[type];
}
