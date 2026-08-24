import type { VocabularyEntry } from "@/types/vocabulary";
import type { QuestionType, QuizQuestion } from "@/types/quiz";
import type { WeaknessScore } from "@/types/statistics";

export interface SynonymComparison {
  wordA: string;
  wordB: string;
  nuanceA: string;
  nuanceB: string;
  usageNote: string;
}

export interface ProductionEvaluation {
  grammaticallyCorrect: boolean;
  usesTargetWordCorrectly: boolean;
  natural: boolean;
  semanticFit: boolean;
  score: number; // 0-100
  feedback: string;
}

export interface WeaknessAnalysis {
  summary: string;
  recommendations: string[];
}

export interface DailyMissionSuggestion {
  newWordsTarget: number;
  reviewsTarget: number;
  synonymQuestionsTarget: number;
  collocationQuestionsTarget: number;
  rationale: string;
}

/**
 * Provider-agnostic AI abstraction. JLPT N1 Master never hard-codes a
 * specific model provider — everything downstream calls this interface, and
 * `getAiService()` decides at runtime which implementation to hand back
 * (see ai/index.ts). Core learning logic (mastery, SRS, quiz scoring) never
 * depends on this interface — AI only augments explanations/feedback, it
 * never gates whether a word can be marked correct.
 */
export interface AiService {
  readonly providerName: string;
  generateVocabularyExplanation(vocab: VocabularyEntry): Promise<string>;
  generateExampleSentences(vocab: VocabularyEntry, count: number): Promise<string[]>;
  compareSynonyms(vocab: VocabularyEntry, synonymWord: string): Promise<SynonymComparison>;
  evaluateProductionSentence(vocab: VocabularyEntry, sentence: string): Promise<ProductionEvaluation>;
  generateQuiz(vocab: VocabularyEntry, type: QuestionType): Promise<QuizQuestion | null>;
  generateDailyMission(weaknesses: WeaknessScore[]): Promise<DailyMissionSuggestion>;
  analyzeWeakness(weaknesses: WeaknessScore[]): Promise<WeaknessAnalysis>;
}
