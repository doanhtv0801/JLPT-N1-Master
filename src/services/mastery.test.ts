import { describe, expect, it } from "vitest";
import {
  computeOverallMastery,
  computeMasteryLevel,
  levelToStatus,
  updateDimension,
  updateMastery,
} from "./mastery";
import { MasteryLevel } from "@/types/mastery";
import type { MasteryDimensions } from "@/types/mastery";

const full: MasteryDimensions = {
  reading: 100,
  meaning: 100,
  context: 100,
  synonym: 100,
  collocation: 100,
  production: 100,
};

const empty: MasteryDimensions = {
  reading: 0,
  meaning: 0,
  context: 0,
  synonym: 0,
  collocation: 0,
  production: 0,
};

describe("computeOverallMastery", () => {
  it("returns 100 when every dimension is maxed", () => {
    expect(computeOverallMastery(full)).toBe(100);
  });

  it("returns 0 when every dimension is zero", () => {
    expect(computeOverallMastery(empty)).toBe(0);
  });

  it("weights production and synonym above reading", () => {
    const strongReading: MasteryDimensions = { ...empty, reading: 100 };
    const strongProduction: MasteryDimensions = { ...empty, production: 100 };
    expect(computeOverallMastery(strongProduction)).toBeGreaterThan(computeOverallMastery(strongReading));
  });
});

describe("computeMasteryLevel", () => {
  it("is Unseen when the word has never been seen", () => {
    expect(computeMasteryLevel(empty, false)).toBe(MasteryLevel.Unseen);
  });

  it("is Recognized once seen but reading still weak", () => {
    expect(computeMasteryLevel(empty, true)).toBe(MasteryLevel.Recognized);
  });

  it("requires reading, meaning, context, synonym AND production before Mastered", () => {
    const almost: MasteryDimensions = {
      reading: 95,
      meaning: 95,
      context: 95,
      synonym: 95,
      collocation: 95,
      production: 60, // below the known threshold
    };
    expect(computeMasteryLevel(almost, true)).toBe(MasteryLevel.SynonymsDistinguished);
  });

  it("reaches Mastered only when every dimension clears the completion bar", () => {
    expect(computeMasteryLevel(full, true)).toBe(MasteryLevel.Mastered);
  });

  it("is sequential: a high synonym score alone does not skip earlier levels", () => {
    const gamedSynonym: MasteryDimensions = { ...empty, synonym: 100 };
    expect(computeMasteryLevel(gamedSynonym, true)).toBe(MasteryLevel.Recognized);
  });
});

describe("levelToStatus", () => {
  it("maps every level to a valid status without throwing", () => {
    for (let lvl = 0; lvl <= 7; lvl++) {
      expect(() => levelToStatus(lvl)).not.toThrow();
    }
    expect(levelToStatus(MasteryLevel.Unseen)).toBe("unseen");
    expect(levelToStatus(MasteryLevel.Mastered)).toBe("mastered");
  });
});

describe("updateDimension", () => {
  it("increases on a correct answer but never exceeds 100", () => {
    expect(updateDimension(50, true)).toBeGreaterThan(50);
    expect(updateDimension(100, true)).toBe(100);
  });

  it("decreases on an incorrect answer but never drops below 0", () => {
    expect(updateDimension(50, false)).toBeLessThan(50);
    expect(updateDimension(0, false)).toBe(0);
  });

  it("has diminishing gains as a dimension approaches mastery", () => {
    const gainFromLow = updateDimension(10, true) - 10;
    const gainFromHigh = updateDimension(90, true) - 90;
    expect(gainFromHigh).toBeLessThan(gainFromLow);
  });
});

describe("updateMastery", () => {
  it("only mutates the targeted dimension", () => {
    const result = updateMastery(empty, "synonym", true);
    expect(result.synonym).toBeGreaterThan(0);
    expect(result.reading).toBe(0);
    expect(result.meaning).toBe(0);
  });
});
