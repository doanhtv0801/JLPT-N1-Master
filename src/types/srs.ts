/**
 * Spaced-repetition fields, modeled after FSRS (Free Spaced Repetition
 * Scheduler) rather than a fixed Leitner/SM-2 interval table — see
 * services/srs.ts for the scheduling algorithm itself.
 */
export interface SrsState {
  /** FSRS difficulty, 1 (easy) - 10 (hard). */
  difficulty: number;
  /** FSRS stability in days: how long until retrievability decays to ~90%. */
  stability: number;
  /** Estimated probability (0-1) the word is still recallable right now. */
  retrievability: number;
  lastReviewedAt: string | null;
  nextReviewAt: string;
  reviewCount: number;
  correctCount: number;
  incorrectCount: number;
  lapseCount: number;
}

export const INITIAL_SRS_STATE: SrsState = {
  difficulty: 5,
  stability: 1,
  retrievability: 1,
  lastReviewedAt: null,
  nextReviewAt: new Date().toISOString(),
  reviewCount: 0,
  correctCount: 0,
  incorrectCount: 0,
  lapseCount: 0,
};

export type ReviewGrade = "again" | "hard" | "good" | "easy";
