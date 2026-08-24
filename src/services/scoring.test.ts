import { describe, expect, it } from "vitest";
import { estimateJlptScore } from "./scoring";

const baseInputs = {
  vocabularyMasteryAvg: 0,
  recentAccuracy: 0,
  contextMasteryAvg: 0,
  synonymMasteryAvg: 0,
  productionMasteryAvg: 0,
  totalReviews: 0,
};

describe("estimateJlptScore", () => {
  it("never exceeds 60 points per section or 180 total", () => {
    const result = estimateJlptScore({
      ...baseInputs,
      vocabularyMasteryAvg: 100,
      recentAccuracy: 100,
      contextMasteryAvg: 100,
      synonymMasteryAvg: 100,
      productionMasteryAvg: 100,
      totalReviews: 1000,
    });
    expect(result.languageKnowledge).toBeLessThanOrEqual(60);
    expect(result.reading).toBeLessThanOrEqual(60);
    expect(result.listening).toBeLessThanOrEqual(60);
    expect(result.total).toBeLessThanOrEqual(180);
    expect(result.total).toBe(result.languageKnowledge + result.reading + result.listening);
  });

  it("never goes negative with all-zero input", () => {
    const result = estimateJlptScore(baseInputs);
    expect(result.languageKnowledge).toBeGreaterThanOrEqual(0);
    expect(result.reading).toBeGreaterThanOrEqual(0);
    expect(result.listening).toBeGreaterThanOrEqual(0);
  });

  it("is monotonic: higher mastery and accuracy never produce a lower score", () => {
    const low = estimateJlptScore({ ...baseInputs, vocabularyMasteryAvg: 20, recentAccuracy: 20 });
    const high = estimateJlptScore({ ...baseInputs, vocabularyMasteryAvg: 80, recentAccuracy: 80 });
    expect(high.total).toBeGreaterThanOrEqual(low.total);
  });

  it("reports low confidence with few recorded reviews and higher confidence with many", () => {
    const fewReviews = estimateJlptScore({ ...baseInputs, totalReviews: 5 });
    const manyReviews = estimateJlptScore({ ...baseInputs, totalReviews: 600 });
    expect(fewReviews.confidence).toBe("low");
    expect(manyReviews.confidence).toBe("high");
  });
});
