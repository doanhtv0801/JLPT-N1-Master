import { describe, expect, it } from "vitest";
import { computeStreaks } from "./streak";

describe("computeStreaks", () => {
  it("returns zero streaks with no activity", () => {
    expect(computeStreaks([])).toEqual({ current: 0, longest: 0 });
  });

  it("counts a consecutive run ending today as the current streak", () => {
    const { current } = computeStreaks(["2026-01-01", "2026-01-02", "2026-01-03"], "2026-01-03");
    expect(current).toBe(3);
  });

  it("still counts yesterday's streak as current if today has no activity yet", () => {
    const { current } = computeStreaks(["2026-01-01", "2026-01-02"], "2026-01-03");
    expect(current).toBe(2);
  });

  it("resets current streak to 0 after a gap of more than one day", () => {
    const { current } = computeStreaks(["2026-01-01"], "2026-01-05");
    expect(current).toBe(0);
  });

  it("tracks the longest streak even after it has since broken", () => {
    const { longest, current } = computeStreaks(
      ["2026-01-01", "2026-01-02", "2026-01-03", "2026-01-10"],
      "2026-01-10"
    );
    expect(longest).toBe(3);
    expect(current).toBe(1);
  });
});
