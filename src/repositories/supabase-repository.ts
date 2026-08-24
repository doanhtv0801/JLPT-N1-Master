import type { SupabaseClient } from "@supabase/supabase-js";
import type { LearningRepository } from "./types";
import type {
  DailyActivity,
  DailyMission,
  Mistake,
  UserProfile,
  UserVocabulary,
} from "@/types";

/* eslint-disable @typescript-eslint/no-explicit-any */

function profileFromRow(row: any, email: string | null): UserProfile {
  return {
    id: row.id,
    email,
    name: row.name,
    isDemo: false,
    currentLevel: row.current_level,
    goal: row.goal,
    targetTestDate: row.target_test_date,
    dailyStudyMinutesTarget: row.daily_study_minutes_target,
    dailyNewWordsTarget: row.daily_new_words_target,
    dailyReviewTarget: row.daily_review_target,
    interfaceLanguage: row.interface_language,
    translationLanguage: row.translation_language,
    theme: row.theme,
    onboardingCompleted: row.onboarding_completed,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function userVocabularyFromRow(row: any): UserVocabulary {
  return {
    id: row.id,
    userId: row.user_id,
    vocabularyId: row.vocabulary_id,
    status: row.status,
    masteryLevel: row.mastery_level,
    overallMastery: Number(row.overall_mastery),
    mastery: {
      reading: Number(row.reading_mastery),
      meaning: Number(row.meaning_mastery),
      context: Number(row.context_mastery),
      synonym: Number(row.synonym_mastery),
      collocation: Number(row.collocation_mastery),
      production: Number(row.production_mastery),
    },
    srs: {
      difficulty: Number(row.difficulty),
      stability: Number(row.stability),
      retrievability: Number(row.retrievability),
      lastReviewedAt: row.last_reviewed_at,
      nextReviewAt: row.next_review_at,
      reviewCount: row.review_count,
      correctCount: row.correct_count,
      incorrectCount: row.incorrect_count,
      lapseCount: row.lapse_count,
    },
    bookmarked: row.bookmarked,
    markedDifficult: row.marked_difficult,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function userVocabularyToRow(entry: UserVocabulary) {
  return {
    user_id: entry.userId,
    vocabulary_id: entry.vocabularyId,
    status: entry.status,
    mastery_level: entry.masteryLevel,
    overall_mastery: entry.overallMastery,
    reading_mastery: entry.mastery.reading,
    meaning_mastery: entry.mastery.meaning,
    context_mastery: entry.mastery.context,
    synonym_mastery: entry.mastery.synonym,
    collocation_mastery: entry.mastery.collocation,
    production_mastery: entry.mastery.production,
    difficulty: entry.srs.difficulty,
    stability: entry.srs.stability,
    retrievability: entry.srs.retrievability,
    review_count: entry.srs.reviewCount,
    correct_count: entry.srs.correctCount,
    incorrect_count: entry.srs.incorrectCount,
    lapse_count: entry.srs.lapseCount,
    bookmarked: entry.bookmarked,
    marked_difficult: entry.markedDifficult,
    last_reviewed_at: entry.srs.lastReviewedAt,
    next_review_at: entry.srs.nextReviewAt,
  };
}

/**
 * Real Supabase-backed implementation of `LearningRepository`. Structurally
 * complete against supabase/schema.sql; exercised once real project
 * credentials are supplied (see NEXT_PUBLIC_SUPABASE_URL / ANON_KEY in
 * .env.example) — the demo build never instantiates this class.
 */
export class SupabaseLearningRepository implements LearningRepository {
  constructor(private readonly client: SupabaseClient) {}

  async getProfile(userId: string): Promise<UserProfile | null> {
    const { data: userData } = await this.client.auth.getUser();
    const { data, error } = await this.client
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();
    if (error || !data) return null;
    return profileFromRow(data, userData?.user?.email ?? null);
  }

  async upsertProfile(profile: UserProfile): Promise<void> {
    await this.client.from("profiles").upsert({
      id: profile.id,
      name: profile.name,
      current_level: profile.currentLevel,
      goal: profile.goal,
      target_test_date: profile.targetTestDate,
      daily_study_minutes_target: profile.dailyStudyMinutesTarget,
      daily_new_words_target: profile.dailyNewWordsTarget,
      daily_review_target: profile.dailyReviewTarget,
      interface_language: profile.interfaceLanguage,
      translation_language: profile.translationLanguage,
      theme: profile.theme,
      onboarding_completed: profile.onboardingCompleted,
    });
  }

  async getAllUserVocabulary(userId: string): Promise<UserVocabulary[]> {
    const { data, error } = await this.client
      .from("user_vocabulary")
      .select("*")
      .eq("user_id", userId);
    if (error || !data) return [];
    return data.map(userVocabularyFromRow);
  }

  async getUserVocabulary(userId: string, vocabularyId: string): Promise<UserVocabulary | null> {
    const { data, error } = await this.client
      .from("user_vocabulary")
      .select("*")
      .eq("user_id", userId)
      .eq("vocabulary_id", vocabularyId)
      .maybeSingle();
    if (error || !data) return null;
    return userVocabularyFromRow(data);
  }

  async upsertUserVocabulary(entry: UserVocabulary): Promise<void> {
    await this.client
      .from("user_vocabulary")
      .upsert(userVocabularyToRow(entry), { onConflict: "user_id,vocabulary_id" });
  }

  async recordMistake(mistake: Mistake): Promise<void> {
    await this.client.from("mistakes").insert({
      user_id: mistake.userId,
      vocabulary_id: mistake.vocabularyId,
      question_type: mistake.questionType,
      selected_answer: mistake.selectedAnswer,
      correct_answer: mistake.correctAnswer,
      response_time_ms: mistake.responseTimeMs,
      mistake_count: mistake.mistakeCount,
    });
  }

  async getMistakes(userId: string): Promise<Mistake[]> {
    const { data, error } = await this.client
      .from("mistakes")
      .select("*")
      .eq("user_id", userId)
      .order("answered_at", { ascending: false });
    if (error || !data) return [];
    return data.map((row: any) => ({
      id: row.id,
      userId: row.user_id,
      vocabularyId: row.vocabulary_id,
      questionType: row.question_type,
      selectedAnswer: row.selected_answer,
      correctAnswer: row.correct_answer,
      answeredAt: row.answered_at,
      responseTimeMs: row.response_time_ms,
      mistakeCount: row.mistake_count,
    }));
  }

  async getDailyActivity(userId: string, dateKey: string): Promise<DailyActivity | null> {
    const { data, error } = await this.client
      .from("daily_activity")
      .select("*")
      .eq("user_id", userId)
      .eq("date", dateKey)
      .maybeSingle();
    if (error || !data) return null;
    return {
      date: data.date,
      wordsLearned: data.words_learned,
      reviewsCompleted: data.reviews_completed,
      quizQuestionsAnswered: data.quiz_questions_answered,
      correctAnswers: data.correct_answers,
      studyTimeMinutes: Number(data.study_time_minutes),
      xpEarned: data.xp_earned,
    };
  }

  async getAllDailyActivity(userId: string): Promise<DailyActivity[]> {
    const { data, error } = await this.client
      .from("daily_activity")
      .select("*")
      .eq("user_id", userId);
    if (error || !data) return [];
    return data.map((row: any) => ({
      date: row.date,
      wordsLearned: row.words_learned,
      reviewsCompleted: row.reviews_completed,
      quizQuestionsAnswered: row.quiz_questions_answered,
      correctAnswers: row.correct_answers,
      studyTimeMinutes: Number(row.study_time_minutes),
      xpEarned: row.xp_earned,
    }));
  }

  async upsertDailyActivity(activity: DailyActivity & { userId: string }): Promise<void> {
    await this.client.from("daily_activity").upsert(
      {
        user_id: activity.userId,
        date: activity.date,
        words_learned: activity.wordsLearned,
        reviews_completed: activity.reviewsCompleted,
        quiz_questions_answered: activity.quizQuestionsAnswered,
        correct_answers: activity.correctAnswers,
        study_time_minutes: activity.studyTimeMinutes,
        xp_earned: activity.xpEarned,
      },
      { onConflict: "user_id,date" }
    );
  }

  async getDailyMission(userId: string, dateKey: string): Promise<DailyMission | null> {
    const { data, error } = await this.client
      .from("daily_missions")
      .select("*")
      .eq("user_id", userId)
      .eq("date", dateKey)
      .maybeSingle();
    if (error || !data) return null;
    return {
      date: data.date,
      newWordsTarget: data.new_words_target,
      newWordsDone: data.new_words_done,
      reviewsTarget: data.reviews_target,
      reviewsDone: data.reviews_done,
      synonymQuestionsTarget: data.synonym_questions_target,
      synonymQuestionsDone: data.synonym_questions_done,
      collocationQuestionsTarget: data.collocation_questions_target,
      collocationQuestionsDone: data.collocation_questions_done,
      readingPassagesTarget: data.reading_passages_target,
      readingPassagesDone: data.reading_passages_done,
      listeningQuestionsTarget: data.listening_questions_target,
      listeningQuestionsDone: data.listening_questions_done,
      xpTarget: data.xp_target,
      xpEarned: data.xp_earned,
    };
  }

  async upsertDailyMission(mission: DailyMission & { userId: string }): Promise<void> {
    await this.client.from("daily_missions").upsert(
      {
        user_id: mission.userId,
        date: mission.date,
        new_words_target: mission.newWordsTarget,
        new_words_done: mission.newWordsDone,
        reviews_target: mission.reviewsTarget,
        reviews_done: mission.reviewsDone,
        synonym_questions_target: mission.synonymQuestionsTarget,
        synonym_questions_done: mission.synonymQuestionsDone,
        collocation_questions_target: mission.collocationQuestionsTarget,
        collocation_questions_done: mission.collocationQuestionsDone,
        reading_passages_target: mission.readingPassagesTarget,
        reading_passages_done: mission.readingPassagesDone,
        listening_questions_target: mission.listeningQuestionsTarget,
        listening_questions_done: mission.listeningQuestionsDone,
        xp_target: mission.xpTarget,
        xp_earned: mission.xpEarned,
      },
      { onConflict: "user_id,date" }
    );
  }
}
