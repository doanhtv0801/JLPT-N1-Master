import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type {
  DailyActivity,
  DailyMission,
  MasteryDimensionKey,
  Mistake,
  UserProfile,
  UserVocabulary,
} from "@/types";
import { createDemoProfile } from "@/types/user";
import { createUserVocabulary } from "@/types/user-vocabulary";
import { updateMastery, applyInitialExposure, computeOverallMastery, computeMasteryLevel, levelToStatus } from "@/services/mastery";
import { scheduleNextReview, gradeFromAnswer } from "@/services/srs";
import { toDateKey } from "@/lib/utils";
import { buildSeedDailyActivity, buildSeedUserVocabulary } from "@/lib/demo-seed";

export const DEFAULT_DAILY_MISSION_TARGETS = {
  newWordsTarget: 30,
  reviewsTarget: 100,
  synonymQuestionsTarget: 15,
  collocationQuestionsTarget: 10,
  readingPassagesTarget: 1,
  listeningQuestionsTarget: 10,
  xpTarget: 900,
};

const XP_NEW_WORD = 15;
const XP_CORRECT_ANSWER = 10;
const XP_INCORRECT_ANSWER = 2;

function freshMission(date: string): DailyMission {
  return {
    date,
    ...DEFAULT_DAILY_MISSION_TARGETS,
    newWordsDone: 0,
    reviewsDone: 0,
    synonymQuestionsDone: 0,
    collocationQuestionsDone: 0,
    readingPassagesDone: 0,
    listeningQuestionsDone: 0,
    xpEarned: 0,
  };
}

function freshActivity(date: string): DailyActivity {
  return {
    date,
    wordsLearned: 0,
    reviewsCompleted: 0,
    quizQuestionsAnswered: 0,
    correctAnswers: 0,
    studyTimeMinutes: 0,
    xpEarned: 0,
  };
}

interface AnswerResult {
  userVocabulary: UserVocabulary;
  correct: boolean;
  xpEarned: number;
}

interface LearningState {
  profile: UserProfile;
  userVocabulary: Record<string, UserVocabulary>;
  mistakes: Mistake[];
  dailyActivity: Record<string, DailyActivity>;
  dailyMissions: Record<string, DailyMission>;
  hasSeeded: boolean;
  hasHydrated: boolean;

  setHasHydrated: (v: boolean) => void;
  seedIfEmpty: () => void;
  updateProfile: (patch: Partial<UserProfile>) => void;

  getUserVocabulary: (vocabularyId: string) => UserVocabulary;
  learnNewWord: (vocabularyId: string) => void;
  answerQuestion: (params: {
    vocabularyId: string;
    dimension: MasteryDimensionKey;
    correct: boolean;
    responseTimeMs: number;
    mode: "learn" | "review" | "practice";
  }) => AnswerResult;
  toggleBookmark: (vocabularyId: string) => void;
  toggleDifficult: (vocabularyId: string) => void;

  addMistake: (mistake: Omit<Mistake, "id" | "userId" | "mistakeCount">) => void;

  addStudyMinutes: (minutes: number) => void;
  incrementMissionProgress: (
    key: "newWordsDone" | "reviewsDone" | "synonymQuestionsDone" | "collocationQuestionsDone",
    amount: number
  ) => void;

  resetDemoData: () => void;
}

export const useLearningStore = create<LearningState>()(
  persist(
    (set, get) => ({
      profile: createDemoProfile(),
      userVocabulary: {},
      mistakes: [],
      dailyActivity: {},
      dailyMissions: {},
      hasSeeded: false,
      hasHydrated: false,

      setHasHydrated: (v) => set({ hasHydrated: v }),

      seedIfEmpty: () => {
        if (get().hasSeeded) return;
        set({
          userVocabulary: buildSeedUserVocabulary(),
          dailyActivity: buildSeedDailyActivity(),
          hasSeeded: true,
        });
      },

      updateProfile: (patch) =>
        set((state) => ({ profile: { ...state.profile, ...patch, updatedAt: new Date().toISOString() } })),

      getUserVocabulary: (vocabularyId) => {
        const existing = get().userVocabulary[vocabularyId];
        if (existing) return existing;
        return createUserVocabulary(get().profile.id, vocabularyId);
      },

      learnNewWord: (vocabularyId) => {
        const todayKey = toDateKey(new Date());
        set((state) => {
          const current =
            state.userVocabulary[vocabularyId] ??
            createUserVocabulary(state.profile.id, vocabularyId);
          const nudged = applyInitialExposure(current.mastery);
          const overall = computeOverallMastery(nudged);
          const level = computeMasteryLevel(nudged, true);
          const updated: UserVocabulary = {
            ...current,
            mastery: nudged,
            overallMastery: overall,
            masteryLevel: level,
            status: levelToStatus(level),
            srs: {
              ...current.srs,
              nextReviewAt: new Date(Date.now() + 86_400_000 * 0.5).toISOString(),
            },
            updatedAt: new Date().toISOString(),
          };

          const activity = state.dailyActivity[todayKey] ?? freshActivity(todayKey);
          const mission = state.dailyMissions[todayKey] ?? freshMission(todayKey);

          return {
            userVocabulary: { ...state.userVocabulary, [vocabularyId]: updated },
            dailyActivity: {
              ...state.dailyActivity,
              [todayKey]: {
                ...activity,
                wordsLearned: activity.wordsLearned + 1,
                xpEarned: activity.xpEarned + XP_NEW_WORD,
              },
            },
            dailyMissions: {
              ...state.dailyMissions,
              [todayKey]: {
                ...mission,
                newWordsDone: mission.newWordsDone + 1,
                xpEarned: mission.xpEarned + XP_NEW_WORD,
              },
            },
          };
        });
      },

      answerQuestion: ({ vocabularyId, dimension, correct, responseTimeMs, mode }) => {
        const todayKey = toDateKey(new Date());
        let result!: AnswerResult;

        set((state) => {
          const current =
            state.userVocabulary[vocabularyId] ??
            createUserVocabulary(state.profile.id, vocabularyId);

          const mastery = updateMastery(current.mastery, dimension, correct);
          const overall = computeOverallMastery(mastery);
          const level = computeMasteryLevel(mastery, true);
          const grade = gradeFromAnswer(correct, responseTimeMs);
          const srs = scheduleNextReview(current.srs, grade);
          const xpEarned = correct ? XP_CORRECT_ANSWER : XP_INCORRECT_ANSWER;

          const updated: UserVocabulary = {
            ...current,
            mastery,
            overallMastery: overall,
            masteryLevel: level,
            status: levelToStatus(level),
            srs,
            updatedAt: new Date().toISOString(),
          };

          const activity = state.dailyActivity[todayKey] ?? freshActivity(todayKey);
          const mission = state.dailyMissions[todayKey] ?? freshMission(todayKey);
          const missionKey =
            dimension === "synonym"
              ? ("synonymQuestionsDone" as const)
              : dimension === "collocation"
                ? ("collocationQuestionsDone" as const)
                : mode === "review"
                  ? ("reviewsDone" as const)
                  : null;

          result = { userVocabulary: updated, correct, xpEarned };

          return {
            userVocabulary: { ...state.userVocabulary, [vocabularyId]: updated },
            dailyActivity: {
              ...state.dailyActivity,
              [todayKey]: {
                ...activity,
                reviewsCompleted: activity.reviewsCompleted + (mode === "review" ? 1 : 0),
                quizQuestionsAnswered: activity.quizQuestionsAnswered + 1,
                correctAnswers: activity.correctAnswers + (correct ? 1 : 0),
                xpEarned: activity.xpEarned + xpEarned,
              },
            },
            dailyMissions: {
              ...state.dailyMissions,
              [todayKey]: {
                ...mission,
                xpEarned: mission.xpEarned + xpEarned,
                ...(missionKey ? { [missionKey]: mission[missionKey] + 1 } : {}),
              },
            },
          };
        });

        return result;
      },

      toggleBookmark: (vocabularyId) =>
        set((state) => {
          const current =
            state.userVocabulary[vocabularyId] ??
            createUserVocabulary(state.profile.id, vocabularyId);
          return {
            userVocabulary: {
              ...state.userVocabulary,
              [vocabularyId]: { ...current, bookmarked: !current.bookmarked },
            },
          };
        }),

      toggleDifficult: (vocabularyId) =>
        set((state) => {
          const current =
            state.userVocabulary[vocabularyId] ??
            createUserVocabulary(state.profile.id, vocabularyId);
          return {
            userVocabulary: {
              ...state.userVocabulary,
              [vocabularyId]: { ...current, markedDifficult: !current.markedDifficult },
            },
          };
        }),

      addMistake: (mistake) =>
        set((state) => {
          const existingCount = state.mistakes.filter(
            (m) => m.vocabularyId === mistake.vocabularyId && m.questionType === mistake.questionType
          ).length;
          return {
            mistakes: [
              ...state.mistakes,
              {
                ...mistake,
                id: `${mistake.vocabularyId}-${mistake.questionType}-${Date.now()}`,
                userId: state.profile.id,
                mistakeCount: existingCount + 1,
              },
            ],
          };
        }),

      addStudyMinutes: (minutes) => {
        const todayKey = toDateKey(new Date());
        set((state) => {
          const activity = state.dailyActivity[todayKey] ?? freshActivity(todayKey);
          return {
            dailyActivity: {
              ...state.dailyActivity,
              [todayKey]: { ...activity, studyTimeMinutes: activity.studyTimeMinutes + minutes },
            },
          };
        });
      },

      incrementMissionProgress: (key, amount) => {
        const todayKey = toDateKey(new Date());
        set((state) => {
          const mission = state.dailyMissions[todayKey] ?? freshMission(todayKey);
          return {
            dailyMissions: {
              ...state.dailyMissions,
              [todayKey]: { ...mission, [key]: mission[key] + amount },
            },
          };
        });
      },

      resetDemoData: () =>
        set({
          userVocabulary: buildSeedUserVocabulary(),
          dailyActivity: buildSeedDailyActivity(),
          dailyMissions: {},
          mistakes: [],
          hasSeeded: true,
        }),
    }),
    {
      name: "jlpt-n1-master-demo",
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
        state?.seedIfEmpty();
      },
    }
  )
);
