export interface WeaknessScore {
  /** e.g. "synonyms", "abstract-nouns", "kanji-reading" — a category, not a single word. */
  category: string;
  label: string;
  /** 0-100 */
  score: number;
  classification: "critical" | "weak" | "improving" | "strong" | "mastered";
  sampleSize: number;
}

/**
 * The internal, heuristic JLPT score estimate. This is NEVER presented as an
 * official JLPT prediction — see services/scoring.ts for the disclaimer this
 * type is always paired with in the UI.
 */
export interface ScorePrediction {
  languageKnowledge: number; // out of 60
  reading: number; // out of 60
  listening: number; // out of 60
  total: number; // out of 180
  confidence: "low" | "medium" | "high";
  generatedAt: string;
}

export interface StatisticsSnapshot {
  totalWordsLearned: number;
  totalWordsMastered: number;
  vocabularyCorpusSize: number;
  reviewsCompleted: number;
  reviewAccuracy: number; // 0-100
  vocabularyCoverage: number; // 0-100
  dailyLearningTimeMinutes: number;
  currentStreak: number;
  longestStreak: number;
  averageResponseTimeMs: number;
  readingSpeedWpm: number | null;
  listeningAccuracy: number | null;
  scorePrediction: ScorePrediction;
  weakestSkill: string;
  strongestSkill: string;
}
