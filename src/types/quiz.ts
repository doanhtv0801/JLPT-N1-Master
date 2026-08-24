import type { MasteryDimensionKey } from "./mastery";

export type QuestionType =
  | "reading"
  | "meaning"
  | "context"
  | "synonym"
  | "collocation"
  | "confusing-word"
  | "production";

/** Which mastery dimension a correct answer to this question type reinforces. */
export const QUESTION_TYPE_DIMENSION: Record<QuestionType, MasteryDimensionKey> = {
  reading: "reading",
  meaning: "meaning",
  context: "context",
  synonym: "synonym",
  collocation: "collocation",
  "confusing-word": "synonym",
  production: "production",
};

export interface QuizOption {
  id: string;
  label: string;
  isCorrect: boolean;
}

export interface QuizQuestion {
  id: string;
  type: QuestionType;
  vocabularyId: string;
  /** The word/sentence/prompt shown to the learner. */
  prompt: string;
  /** Optional supporting context (e.g. the sentence a blank is drawn from). */
  context?: string;
  options: QuizOption[];
  explanation: string;
}

export interface QuizAnswer {
  questionId: string;
  vocabularyId: string;
  questionType: QuestionType;
  selectedOptionId: string | null;
  correct: boolean;
  responseTimeMs: number;
  answeredAt: string;
}

export interface QuizSessionResult {
  id: string;
  userId: string;
  mode: "learn" | "review" | "practice" | "mock";
  answers: QuizAnswer[];
  startedAt: string;
  finishedAt: string;
  xpEarned: number;
}
