import type {
  DailyActivity,
  DailyMission,
  Mistake,
  UserProfile,
  UserVocabulary,
} from "@/types";

/**
 * The persistence contract the rest of the app depends on. Two
 * implementations satisfy it: `DemoLearningRepository` (localStorage via
 * Zustand — zero configuration) and `SupabaseLearningRepository` (Postgres
 * via Supabase). `getLearningRepository()` in repositories/index.ts decides
 * which one to hand back; no other code imports a concrete class.
 */
export interface LearningRepository {
  getProfile(userId: string): Promise<UserProfile | null>;
  upsertProfile(profile: UserProfile): Promise<void>;

  getAllUserVocabulary(userId: string): Promise<UserVocabulary[]>;
  getUserVocabulary(userId: string, vocabularyId: string): Promise<UserVocabulary | null>;
  upsertUserVocabulary(entry: UserVocabulary): Promise<void>;

  recordMistake(mistake: Mistake): Promise<void>;
  getMistakes(userId: string): Promise<Mistake[]>;

  getDailyActivity(userId: string, dateKey: string): Promise<DailyActivity | null>;
  getAllDailyActivity(userId: string): Promise<DailyActivity[]>;
  upsertDailyActivity(activity: DailyActivity & { userId: string }): Promise<void>;

  getDailyMission(userId: string, dateKey: string): Promise<DailyMission | null>;
  upsertDailyMission(mission: DailyMission & { userId: string }): Promise<void>;

  resetDemoData?(): Promise<void>;
}
