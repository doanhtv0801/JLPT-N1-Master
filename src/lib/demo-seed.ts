import { VOCABULARY } from "@/data/vocabulary";
import { createUserVocabulary } from "@/types/user-vocabulary";
import type { DailyActivity, UserVocabulary } from "@/types";
import { computeOverallMastery, computeMasteryLevel, levelToStatus } from "@/services/mastery";
import { toDateKey } from "@/lib/utils";

const DEMO_USER_ID = "demo-user";

function daysAgoIso(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

/**
 * Deterministic demo progress so a brand-new session already looks like a
 * learner mid-journey (per spec: dashboard must be compelling immediately),
 * while staying honest about the actual size of the demo corpus (200 words)
 * rather than faking a 12,000-word history.
 */
export function buildSeedUserVocabulary(): Record<string, UserVocabulary> {
  const result: Record<string, UserVocabulary> = {};

  VOCABULARY.forEach((vocab, i) => {
    let dims;
    let daysSinceReview = 0;
    let stability = 1;
    let bookmarked = false;

    if (i < 15) {
      // Mastered tier
      dims = { reading: 99, meaning: 98, context: 93, synonym: 91, collocation: 92, production: 88 };
      daysSinceReview = 3 + (i % 5);
      stability = 45 + i * 3;
    } else if (i < 29) {
      // Mature tier — some intentionally due now to populate the review queue
      const dueNow = i % 3 !== 0;
      dims = { reading: 92, meaning: 85, context: 68, synonym: 55, collocation: 60, production: 40 };
      daysSinceReview = dueNow ? 14 : 2;
      stability = dueNow ? 8 : 20;
      bookmarked = i % 7 === 0;
    } else if (i < 39) {
      // Young / still learning
      dims = { reading: 70, meaning: 58, context: 30, synonym: 20, collocation: 25, production: 10 };
      daysSinceReview = 1;
      stability = 2;
    } else {
      return; // remaining words stay fully unseen
    }

    const overall = computeOverallMastery(dims);
    const level = computeMasteryLevel(dims, true);
    const lastReviewedAt = daysAgoIso(daysSinceReview);
    const nextReviewAt = new Date(
      new Date(lastReviewedAt).getTime() + stability * 86_400_000
    ).toISOString();

    const uv = createUserVocabulary(DEMO_USER_ID, vocab.id, {
      status: levelToStatus(level),
      masteryLevel: level,
      overallMastery: overall,
      mastery: dims,
      bookmarked,
      srs: {
        difficulty: 4 + (i % 4),
        stability,
        retrievability: 0.9,
        lastReviewedAt,
        nextReviewAt,
        reviewCount: 6 + (i % 10),
        correctCount: 5 + (i % 8),
        incorrectCount: i % 3,
        lapseCount: i % 5 === 0 ? 1 : 0,
      },
    });
    result[vocab.id] = uv;
  });

  return result;
}

/** Seeds exactly a 42-day activity streak ending today, matching the product's example flavor. */
export function buildSeedDailyActivity(): Record<string, DailyActivity> {
  const result: Record<string, DailyActivity> = {};
  for (let i = 0; i < 42; i++) {
    const date = toDateKey(new Date(Date.now() - i * 86_400_000));
    const wordsLearned = 3 + (i % 5);
    const reviewsCompleted = 20 + (i % 30);
    const quizQuestionsAnswered = reviewsCompleted + wordsLearned * 3;
    const correctAnswers = Math.round(quizQuestionsAnswered * (0.78 + (i % 10) / 100));
    result[date] = {
      date,
      wordsLearned,
      reviewsCompleted,
      quizQuestionsAnswered,
      correctAnswers,
      studyTimeMinutes: 25 + (i % 20),
      xpEarned: 300 + (i % 15) * 20,
    };
  }
  return result;
}
