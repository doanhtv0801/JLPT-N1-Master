import { describe, expect, it } from "vitest";
import {
  estimateRetrievability,
  scheduleNextReview,
  weakestDimension,
  selectQuestionType,
  dimensionForQuestionType,
  gradeFromAnswer,
} from "./srs";
import { INITIAL_SRS_STATE } from "@/types/srs";
import type { MasteryDimensions } from "@/types/mastery";

describe("estimateRetrievability", () => {
  it("is 1 immediately after review", () => {
    expect(estimateRetrievability(0, 10)).toBe(1);
  });

  it("decays over time", () => {
    const soon = estimateRetrievability(1, 10);
    const later = estimateRetrievability(20, 10);
    expect(later).toBeLessThan(soon);
  });

  it("decays more slowly for higher stability", () => {
    const lowStability = estimateRetrievability(10, 2);
    const highStability = estimateRetrievability(10, 50);
    expect(highStability).toBeGreaterThan(lowStability);
  });
});

describe("scheduleNextReview", () => {
  const now = new Date("2026-01-01T00:00:00Z");

  it("collapses stability and schedules a near-term review on a lapse", () => {
    const result = scheduleNextReview(INITIAL_SRS_STATE, "again", now);
    expect(result.stability).toBeLessThan(INITIAL_SRS_STATE.stability * 1.5);
    expect(result.lapseCount).toBe(1);
    expect(new Date(result.nextReviewAt).getTime()).toBeGreaterThan(now.getTime());
  });

  it("grows stability further on 'easy' than on 'hard'", () => {
    const hard = scheduleNextReview(INITIAL_SRS_STATE, "hard", now);
    const easy = scheduleNextReview(INITIAL_SRS_STATE, "easy", now);
    expect(easy.stability).toBeGreaterThan(hard.stability);
  });

  it("tracks review/correct/incorrect counters", () => {
    const afterGood = scheduleNextReview(INITIAL_SRS_STATE, "good", now);
    expect(afterGood.reviewCount).toBe(1);
    expect(afterGood.correctCount).toBe(1);
    expect(afterGood.incorrectCount).toBe(0);

    const afterLapse = scheduleNextReview(afterGood, "again", now);
    expect(afterLapse.reviewCount).toBe(2);
    expect(afterLapse.incorrectCount).toBe(1);
  });
});

describe("gradeFromAnswer", () => {
  it("is always 'again' on an incorrect answer regardless of speed", () => {
    expect(gradeFromAnswer(false, 500)).toBe("again");
  });

  it("rewards fast correct answers with a higher grade", () => {
    expect(gradeFromAnswer(true, 1000)).toBe("easy");
    expect(gradeFromAnswer(true, 8000)).toBe("hard");
  });
});

describe("weakestDimension / selectQuestionType", () => {
  const mastery: MasteryDimensions = {
    reading: 100,
    meaning: 90,
    context: 80,
    synonym: 20,
    collocation: 70,
    production: 60,
  };

  it("identifies synonym as the weakest dimension", () => {
    expect(weakestDimension(mastery)).toBe("synonym");
  });

  it("selects a question type that maps back to the weak dimension", () => {
    const type = selectQuestionType(mastery, true, false, true);
    expect(dimensionForQuestionType(type)).toBe("synonym");
  });

  it("falls back to meaning when the weak dimension has no viable question type", () => {
    const type = selectQuestionType(mastery, false, false, true);
    expect(type).toBe("meaning");
  });
});
