import { describe, expect, it } from "vitest";
import { generateQuestion, scoreProductionSentence } from "./quiz";
import { VOCABULARY, getVocabularyById } from "@/data/vocabulary";

describe("generateQuestion", () => {
  const target = getVocabularyById("sokushin")!; // 促進

  it("always produces exactly one correct option among 3-4 total", () => {
    for (const type of ["reading", "meaning", "context", "collocation"] as const) {
      const q = generateQuestion(target, type, VOCABULARY);
      const correctOptions = q.options.filter((o) => o.isCorrect);
      expect(correctOptions).toHaveLength(1);
      expect(q.options.length).toBeGreaterThanOrEqual(2);
      expect(q.options.length).toBeLessThanOrEqual(4);
    }
  });

  it("never duplicates the correct answer as a distractor", () => {
    const q = generateQuestion(target, "meaning", VOCABULARY);
    const labels = q.options.map((o) => o.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("falls back to a meaning question when a type has no data to build from", () => {
    const noSynonyms = VOCABULARY.find((v) => v.synonyms.length === 0)!;
    const q = generateQuestion(noSynonyms, "synonym", VOCABULARY);
    expect(q.type).toBe("meaning");
  });

  it("ties every generated question back to the requested vocabulary id", () => {
    const q = generateQuestion(target, "reading", VOCABULARY);
    expect(q.vocabularyId).toBe(target.id);
  });
});

describe("scoreProductionSentence", () => {
  const target = getVocabularyById("sokushin")!;

  it("passes the baseline check when the sentence uses the target word", () => {
    const result = scoreProductionSentence(target, "この政策は成長を促進する。");
    expect(result.containsTargetWord).toBe(true);
    expect(result.passesBaselineCheck).toBe(true);
  });

  it("fails when the sentence omits the target word", () => {
    const result = scoreProductionSentence(target, "これは無関係な文です。");
    expect(result.containsTargetWord).toBe(false);
    expect(result.passesBaselineCheck).toBe(false);
  });
});
