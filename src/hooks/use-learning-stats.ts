"use client";

import { useMemo } from "react";
import { useLearningStore, DEFAULT_DAILY_MISSION_TARGETS } from "@/lib/store/learning-store";
import { VOCABULARY, VOCABULARY_CORPUS_SIZE, VOCABULARY_CORPUS_TARGET } from "@/data/vocabulary";
import { isDue } from "@/services/srs";
import { computeDimensionWeaknesses, weakestAndStrongest } from "@/services/weakness";
import { estimateJlptScore } from "@/services/scoring";
import { computeStreaks } from "@/services/streak";
import { MASTERY_DIMENSION_KEYS } from "@/types/mastery";
import type { MasteryDimensions, UserVocabulary } from "@/types";
import { toDateKey } from "@/lib/utils";

function averageDimensions(list: UserVocabulary[]): MasteryDimensions {
  if (list.length === 0) {
    return { reading: 0, meaning: 0, context: 0, synonym: 0, collocation: 0, production: 0 };
  }
  const sums = list.reduce(
    (acc, uv) => {
      MASTERY_DIMENSION_KEYS.forEach((key) => (acc[key] += uv.mastery[key]));
      return acc;
    },
    { reading: 0, meaning: 0, context: 0, synonym: 0, collocation: 0, production: 0 }
  );
  const result = {} as MasteryDimensions;
  MASTERY_DIMENSION_KEYS.forEach((key) => (result[key] = Math.round(sums[key] / list.length)));
  return result;
}

export function useLearningStats() {
  const userVocabulary = useLearningStore((s) => s.userVocabulary);
  const dailyActivity = useLearningStore((s) => s.dailyActivity);
  const dailyMissions = useLearningStore((s) => s.dailyMissions);
  const profile = useLearningStore((s) => s.profile);
  const hasHydrated = useLearningStore((s) => s.hasHydrated);

  return useMemo(() => {
    const now = new Date();
    const todayKey = toDateKey(now);
    const uvList = Object.values(userVocabulary);
    const seen = uvList.filter((u) => u.status !== "unseen");

    const masteredCount = uvList.filter((u) => u.status === "mastered").length;
    const dueList = seen.filter((u) => isDue(u.srs, now));
    const recordedIds = new Set(uvList.map((u) => u.vocabularyId));
    const newWordsAvailable = VOCABULARY.filter(
      (v) => !recordedIds.has(v.id) || userVocabulary[v.id]?.status === "unseen"
    ).length;
    const learningCount = seen.filter((u) => u.status === "learning" || u.status === "young").length;

    const totalOverallMastery = VOCABULARY.reduce(
      (sum, v) => sum + (userVocabulary[v.id]?.overallMastery ?? 0),
      0
    );
    const vocabularyMasteryPercent =
      VOCABULARY_CORPUS_SIZE > 0 ? Math.round(totalOverallMastery / VOCABULARY_CORPUS_SIZE) : 0;

    const dimensionAverages = averageDimensions(seen);
    const weaknesses = computeDimensionWeaknesses(dimensionAverages, seen.length);
    const { weakest, strongest } = weakestAndStrongest(weaknesses);

    const activityEntries = Object.values(dailyActivity);
    const last7 = activityEntries.filter((a) => {
      const diffDays = (now.getTime() - new Date(`${a.date}T00:00:00`).getTime()) / 86_400_000;
      return diffDays <= 7;
    });
    const recentAnswered = last7.reduce((sum, a) => sum + a.quizQuestionsAnswered, 0);
    const recentCorrect = last7.reduce((sum, a) => sum + a.correctAnswers, 0);
    const recentAccuracy = recentAnswered > 0 ? (recentCorrect / recentAnswered) * 100 : 75;
    const totalReviews = activityEntries.reduce((sum, a) => sum + a.quizQuestionsAnswered, 0);

    const activeDateKeys = activityEntries.filter((a) => a.xpEarned > 0).map((a) => a.date);
    const streak = computeStreaks(activeDateKeys, todayKey);

    const scorePrediction = estimateJlptScore({
      vocabularyMasteryAvg: vocabularyMasteryPercent,
      recentAccuracy,
      contextMasteryAvg: dimensionAverages.context,
      synonymMasteryAvg: dimensionAverages.synonym,
      productionMasteryAvg: dimensionAverages.production,
      totalReviews,
    });

    const todayMission = dailyMissions[todayKey] ?? {
      date: todayKey,
      ...DEFAULT_DAILY_MISSION_TARGETS,
      newWordsDone: 0,
      reviewsDone: 0,
      synonymQuestionsDone: 0,
      collocationQuestionsDone: 0,
      readingPassagesDone: 0,
      listeningQuestionsDone: 0,
      xpEarned: 0,
    };

    const todayActivity = dailyActivity[todayKey] ?? {
      date: todayKey,
      wordsLearned: 0,
      reviewsCompleted: 0,
      quizQuestionsAnswered: 0,
      correctAnswers: 0,
      studyTimeMinutes: 0,
      xpEarned: 0,
    };

    const recentlyLearned = [...seen]
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 6);

    return {
      hasHydrated,
      profile,
      corpusSize: VOCABULARY_CORPUS_SIZE,
      corpusTarget: VOCABULARY_CORPUS_TARGET,
      masteredCount,
      newWordsAvailable,
      learningCount,
      dueCount: dueList.length,
      dueList,
      vocabularyMasteryPercent,
      dimensionAverages,
      weaknesses,
      weakest,
      strongest,
      streak,
      scorePrediction,
      todayMission,
      todayActivity,
      dailyActivity,
      recentlyLearned,
      seenCount: seen.length,
    };
  }, [userVocabulary, dailyActivity, dailyMissions, profile, hasHydrated]);
}
