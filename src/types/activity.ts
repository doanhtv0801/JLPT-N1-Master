export interface DailyMission {
  date: string; // YYYY-MM-DD
  newWordsTarget: number;
  newWordsDone: number;
  reviewsTarget: number;
  reviewsDone: number;
  synonymQuestionsTarget: number;
  synonymQuestionsDone: number;
  collocationQuestionsTarget: number;
  collocationQuestionsDone: number;
  readingPassagesTarget: number;
  readingPassagesDone: number;
  listeningQuestionsTarget: number;
  listeningQuestionsDone: number;
  xpTarget: number;
  xpEarned: number;
}

export function missionCompletion(mission: DailyMission): number {
  if (mission.xpTarget <= 0) return 0;
  return Math.min(100, Math.round((mission.xpEarned / mission.xpTarget) * 100));
}

export interface DailyActivity {
  date: string; // YYYY-MM-DD
  wordsLearned: number;
  reviewsCompleted: number;
  quizQuestionsAnswered: number;
  correctAnswers: number;
  studyTimeMinutes: number;
  xpEarned: number;
}

export interface Mistake {
  id: string;
  userId: string;
  vocabularyId: string;
  questionType: import("./quiz").QuestionType;
  selectedAnswer: string;
  correctAnswer: string;
  answeredAt: string;
  responseTimeMs: number;
  mistakeCount: number;
}

export interface Milestone {
  id: string;
  title: string;
  description: string;
  achieved: boolean;
  achievedAt: string | null;
  /** 0-1 progress toward achieving it, for display when not yet achieved. */
  progress: number;
}
