export interface KanjiEntry {
  id: string;
  character: string;
  meaning: string[];
  onReadings: string[];
  kunReadings: string[];
  radical: string;
  strokeCount: number;
  jlptLevel: import("./vocabulary").JlptLevel;
  /** Vocabulary ids that use this kanji, ordered simple -> complex for the "network" view. */
  relatedVocabularyIds: string[];
}
