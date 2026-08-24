import type { MasteryDimensions } from "./mastery";
import type { SrsState } from "./srs";
import type { VocabularyStatus } from "./vocabulary";

/**
 * The per-user, per-word learning record — the row that actually changes as
 * someone studies. Mirrors the `user_vocabulary` table (see supabase/schema.sql).
 */
export interface UserVocabulary {
  id: string;
  userId: string;
  vocabularyId: string;
  status: VocabularyStatus;
  masteryLevel: number; // MasteryLevel enum value, 0-7
  overallMastery: number; // 0-100, derived from `mastery`
  mastery: MasteryDimensions;
  srs: SrsState;
  bookmarked: boolean;
  markedDifficult: boolean;
  createdAt: string;
  updatedAt: string;
}

export function createUserVocabulary(
  userId: string,
  vocabularyId: string,
  overrides?: Partial<UserVocabulary>
): UserVocabulary {
  const now = new Date().toISOString();
  return {
    id: `${userId}:${vocabularyId}`,
    userId,
    vocabularyId,
    status: "unseen",
    masteryLevel: 0,
    overallMastery: 0,
    mastery: { reading: 0, meaning: 0, context: 0, synonym: 0, collocation: 0, production: 0 },
    srs: {
      difficulty: 5,
      stability: 1,
      retrievability: 1,
      lastReviewedAt: null,
      nextReviewAt: now,
      reviewCount: 0,
      correctCount: 0,
      incorrectCount: 0,
      lapseCount: 0,
    },
    bookmarked: false,
    markedDifficult: false,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}
