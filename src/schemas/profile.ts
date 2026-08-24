import { z } from "zod";

export const onboardingSchema = z.object({
  currentLevel: z.enum(["N3", "N2", "N1", "passed-N1"]),
  goal: z.enum(["pass-n1", "score-120", "score-150", "aim-180", "master-japanese"]),
  dailyStudyMinutesTarget: z.number().int().min(5).max(300),
  vocabularySelfAssessment: z.number().int().min(0).max(100),
});
export type OnboardingInput = z.infer<typeof onboardingSchema>;

export const profileSettingsSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(60),
  targetTestDate: z.string().nullable(),
  dailyStudyMinutesTarget: z.number().int().min(5).max(300),
  dailyNewWordsTarget: z.number().int().min(5).max(100),
  dailyReviewTarget: z.number().int().min(10).max(500),
  interfaceLanguage: z.enum(["ja", "en", "vi"]),
  translationLanguage: z.enum(["en", "vi", "none"]),
  theme: z.enum(["light", "dark", "system"]),
});
export type ProfileSettingsInput = z.infer<typeof profileSettingsSchema>;
