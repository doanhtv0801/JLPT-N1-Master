export type CurrentLevel = "N3" | "N2" | "N1" | "passed-N1";
export type LearningGoal =
  | "pass-n1"
  | "score-120"
  | "score-150"
  | "aim-180"
  | "master-japanese";

export interface UserProfile {
  id: string;
  email: string | null;
  name: string;
  isDemo: boolean;
  currentLevel: CurrentLevel;
  goal: LearningGoal;
  targetTestDate: string | null;
  dailyStudyMinutesTarget: number;
  dailyNewWordsTarget: number;
  dailyReviewTarget: number;
  interfaceLanguage: "ja" | "en" | "vi";
  translationLanguage: "en" | "vi" | "none";
  theme: "light" | "dark" | "system";
  onboardingCompleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export function createDemoProfile(overrides?: Partial<UserProfile>): UserProfile {
  const now = new Date().toISOString();
  return {
    id: "demo-user",
    email: null,
    name: "Dan",
    isDemo: true,
    currentLevel: "N2",
    goal: "aim-180",
    targetTestDate: null,
    dailyStudyMinutesTarget: 45,
    dailyNewWordsTarget: 30,
    dailyReviewTarget: 100,
    interfaceLanguage: "en",
    translationLanguage: "en",
    theme: "system",
    onboardingCompleted: true,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}
