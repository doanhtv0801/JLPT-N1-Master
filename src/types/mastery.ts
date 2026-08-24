/**
 * The mastery model. A word is never "learned / not learned" — mastery is
 * tracked across seven independent dimensions, each 0-100, because a learner
 * can recognize a word's reading perfectly while still confusing it with a
 * near-synonym or being unable to produce it themselves.
 */
export interface MasteryDimensions {
  reading: number;
  meaning: number;
  context: number;
  synonym: number;
  collocation: number;
  production: number;
}

export type MasteryDimensionKey = keyof MasteryDimensions;

export const MASTERY_DIMENSION_KEYS: MasteryDimensionKey[] = [
  "reading",
  "meaning",
  "context",
  "synonym",
  "collocation",
  "production",
];

export const MASTERY_DIMENSION_LABELS: Record<MasteryDimensionKey, string> = {
  reading: "Reading",
  meaning: "Meaning",
  context: "Context",
  synonym: "Synonyms",
  collocation: "Collocation",
  production: "Production",
};

/** The 8 discrete mastery levels a word progresses through. */
export enum MasteryLevel {
  Unseen = 0,
  Recognized = 1,
  ReadingKnown = 2,
  MeaningKnown = 3,
  ContextUnderstood = 4,
  SynonymsDistinguished = 5,
  CanProduce = 6,
  Mastered = 7,
}

export const MASTERY_LEVEL_LABELS: Record<MasteryLevel, string> = {
  [MasteryLevel.Unseen]: "Unseen",
  [MasteryLevel.Recognized]: "Recognized",
  [MasteryLevel.ReadingKnown]: "Reading Known",
  [MasteryLevel.MeaningKnown]: "Meaning Known",
  [MasteryLevel.ContextUnderstood]: "Context Understood",
  [MasteryLevel.SynonymsDistinguished]: "Synonyms Distinguished",
  [MasteryLevel.CanProduce]: "Can Produce",
  [MasteryLevel.Mastered]: "Mastered",
};

export type MasteryWeights = MasteryDimensions;

/**
 * Weights used to combine the six dimensions into a single "overall mastery"
 * score. Production and synonym distinction are weighted highest because
 * they are the hardest to fake and the best predictors of real command of
 * the word — this is what keeps the platform honest about "depth over
 * shallow memorization".
 */
export const DEFAULT_MASTERY_WEIGHTS: MasteryWeights = {
  reading: 0.12,
  meaning: 0.13,
  context: 0.2,
  synonym: 0.2,
  collocation: 0.15,
  production: 0.2,
};

export const EMPTY_MASTERY: MasteryDimensions = {
  reading: 0,
  meaning: 0,
  context: 0,
  synonym: 0,
  collocation: 0,
  production: 0,
};
