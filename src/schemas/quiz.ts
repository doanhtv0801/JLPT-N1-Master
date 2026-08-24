import { z } from "zod";

export const quizAnswerSubmissionSchema = z.object({
  questionId: z.string().min(1),
  vocabularyId: z.string().min(1),
  selectedOptionId: z.string().nullable(),
  responseTimeMs: z.number().int().min(0).max(10 * 60 * 1000),
});
export type QuizAnswerSubmission = z.infer<typeof quizAnswerSubmissionSchema>;

export const productionAnswerSchema = z.object({
  vocabularyId: z.string().min(1),
  sentence: z.string().trim().min(1).max(500),
});
export type ProductionAnswer = z.infer<typeof productionAnswerSchema>;

export const learnSessionConfigSchema = z.object({
  wordCount: z.union([z.literal(10), z.literal(20), z.literal(30), z.literal(50)]),
});
export type LearnSessionConfig = z.infer<typeof learnSessionConfigSchema>;
