import type { LearningRepository } from "./types";
import { useLearningStore } from "@/lib/store/learning-store";
import type { DailyActivity, DailyMission, Mistake, UserProfile, UserVocabulary } from "@/types";

/**
 * Adapts the client-side Zustand store (the actual source of truth in demo
 * mode) to the async `LearningRepository` contract, so any code written
 * against the repository interface works identically whether the app is
 * running in demo mode or against Supabase. UI components that need
 * reactivity should prefer `useLearningStore` directly; this wrapper exists
 * for parity with `SupabaseLearningRepository` and for non-reactive callers.
 */
export class DemoLearningRepository implements LearningRepository {
  async getProfile(): Promise<UserProfile | null> {
    return useLearningStore.getState().profile;
  }

  async upsertProfile(profile: UserProfile): Promise<void> {
    useLearningStore.getState().updateProfile(profile);
  }

  async getAllUserVocabulary(): Promise<UserVocabulary[]> {
    return Object.values(useLearningStore.getState().userVocabulary);
  }

  async getUserVocabulary(_userId: string, vocabularyId: string): Promise<UserVocabulary | null> {
    return useLearningStore.getState().userVocabulary[vocabularyId] ?? null;
  }

  async upsertUserVocabulary(entry: UserVocabulary): Promise<void> {
    useLearningStore.setState((state) => ({
      userVocabulary: { ...state.userVocabulary, [entry.vocabularyId]: entry },
    }));
  }

  async recordMistake(mistake: Mistake): Promise<void> {
    useLearningStore.setState((state) => ({ mistakes: [...state.mistakes, mistake] }));
  }

  async getMistakes(): Promise<Mistake[]> {
    return useLearningStore.getState().mistakes;
  }

  async getDailyActivity(_userId: string, dateKey: string): Promise<DailyActivity | null> {
    return useLearningStore.getState().dailyActivity[dateKey] ?? null;
  }

  async getAllDailyActivity(): Promise<DailyActivity[]> {
    return Object.values(useLearningStore.getState().dailyActivity);
  }

  async upsertDailyActivity(activity: DailyActivity & { userId: string }): Promise<void> {
    useLearningStore.setState((state) => ({
      dailyActivity: { ...state.dailyActivity, [activity.date]: activity },
    }));
  }

  async getDailyMission(_userId: string, dateKey: string): Promise<DailyMission | null> {
    return useLearningStore.getState().dailyMissions[dateKey] ?? null;
  }

  async upsertDailyMission(mission: DailyMission & { userId: string }): Promise<void> {
    useLearningStore.setState((state) => ({
      dailyMissions: { ...state.dailyMissions, [mission.date]: mission },
    }));
  }

  async resetDemoData(): Promise<void> {
    useLearningStore.getState().resetDemoData();
  }
}
