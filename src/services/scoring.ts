import type { ScorePrediction } from "@/types/statistics";
import { clamp } from "@/lib/utils";

/**
 * Heuristic JLPT N1 score estimator (v1).
 *
 * IMPORTANT: this produces an internal, illustrative estimate only. It is
 * deliberately never called an "official JLPT prediction" anywhere in the
 * UI — see the ScorePrediction consumers, which always pair it with a
 * disclaimer. The shape here (typed inputs -> typed output) is designed so
 * a future ML-based estimator can be swapped in without touching callers.
 */
export interface ScoreEstimationInputs {
  /** 0-100 average overall mastery across words the learner has actually studied. */
  vocabularyMasteryAvg: number;
  /** 0-100 accuracy across recent quiz/review answers. */
  recentAccuracy: number;
  /** 0-100 average "context" mastery dimension — proxy for reading comprehension. */
  contextMasteryAvg: number;
  /** 0-100 average "synonym" mastery dimension — proxy for nuance/grammar precision. */
  synonymMasteryAvg: number;
  /** 0-100 average "production" mastery dimension. */
  productionMasteryAvg: number;
  /** Total number of reviews/answers ever recorded — drives confidence. */
  totalReviews: number;
}

function percentToScaledPoints(percent: number, maxPoints: number): number {
  return clamp(Math.round((percent / 100) * maxPoints), 0, maxPoints);
}

export function estimateJlptScore(inputs: ScoreEstimationInputs): ScorePrediction {
  const languageKnowledgePercent = clamp(
    inputs.vocabularyMasteryAvg * 0.35 +
      inputs.synonymMasteryAvg * 0.25 +
      inputs.productionMasteryAvg * 0.15 +
      inputs.recentAccuracy * 0.25,
    0,
    100
  );

  // Phase 1 has no dedicated reading module yet, so "context mastery" (how
  // well a word is understood inside a sentence) stands in as the proxy.
  const readingPercent = clamp(
    inputs.contextMasteryAvg * 0.6 + inputs.recentAccuracy * 0.4,
    0,
    100
  );

  // No listening data is collected in Phase 1 either; pull toward a neutral
  // 55% baseline so the estimate doesn't overreact to vocabulary-only signal.
  const listeningPercent = clamp(
    inputs.recentAccuracy * 0.3 + inputs.vocabularyMasteryAvg * 0.2 + 55 * 0.5,
    0,
    100
  );

  const languageKnowledge = percentToScaledPoints(languageKnowledgePercent, 60);
  const reading = percentToScaledPoints(readingPercent, 60);
  const listening = percentToScaledPoints(listeningPercent, 60);

  const confidence: ScorePrediction["confidence"] =
    inputs.totalReviews < 100 ? "low" : inputs.totalReviews < 500 ? "medium" : "high";

  return {
    languageKnowledge,
    reading,
    listening,
    total: languageKnowledge + reading + listening,
    confidence,
    generatedAt: new Date().toISOString(),
  };
}
