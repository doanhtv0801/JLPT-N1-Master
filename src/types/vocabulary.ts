/**
 * Core vocabulary domain types.
 *
 * A word is never reduced to "one kanji -> one translation": every entry
 * carries the surrounding material (examples, collocations, synonyms,
 * confusable neighbors) that mastery is actually measured against.
 */

export type JlptLevel = "N5" | "N4" | "N3" | "N2" | "N1";

export type PartOfSpeech =
  | "noun"
  | "na-adjective"
  | "i-adjective"
  | "verb-suru"
  | "verb-godan"
  | "verb-ichidan"
  | "adverb"
  | "conjunction"
  | "expression"
  | "onomatopoeia"
  | "auxiliary";

export type VocabularyTopic =
  | "politics"
  | "economics"
  | "business"
  | "finance"
  | "society"
  | "education"
  | "science"
  | "technology"
  | "environment"
  | "medicine"
  | "law"
  | "psychology"
  | "culture"
  | "journalism"
  | "employment"
  | "academic"
  | "abstract-concepts"
  | "emotion"
  | "relationships"
  | "formal-written"
  | "news";

export interface VocabularyExample {
  id: string;
  japanese: string;
  reading?: string;
  translationEn: string;
  translationVi?: string;
  /** Register the example illustrates, e.g. news article, formal speech. */
  register?: "formal-written" | "news" | "business" | "spoken" | "academic";
}

export interface VocabularyCollocation {
  id: string;
  phrase: string;
  reading?: string;
  translationEn: string;
}

export interface ConfusingWordRef {
  vocabularyId: string;
  word: string;
  reading: string;
  /** Short note on how this word differs from the parent entry. */
  distinction: string;
}

export interface RelatedWordRef {
  vocabularyId: string;
  word: string;
  reading: string;
  relation: "synonym" | "antonym" | "related" | "confusing";
  /** Nuance explaining the difference/relationship — required for synonyms & confusing words. */
  nuance?: string;
}

export interface VocabularyEntry {
  id: string;
  word: string;
  reading: string;
  hiragana: string;
  romaji: string;
  meaningEn: string[];
  meaningVi: string[];
  definitionJa: string;
  partOfSpeech: PartOfSpeech[];
  jlptLevel: JlptLevel;
  /** 0-100, higher = more frequent in real Japanese usage. */
  frequencyScore: number;
  /** 0-100, subjective difficulty independent of frequency. */
  difficulty: number;
  topics: VocabularyTopic[];
  tags: string[];
  /** Kanji characters composing this word, referencing KanjiEntry.character. */
  kanji: string[];
  examples: VocabularyExample[];
  collocations: VocabularyCollocation[];
  synonyms: RelatedWordRef[];
  antonyms: RelatedWordRef[];
  confusingWords: ConfusingWordRef[];
  relatedWords: RelatedWordRef[];
  /** Optional pre-recorded audio; when absent the TTS abstraction is used. */
  audioUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export type VocabularyStatus =
  | "unseen"
  | "learning"
  | "young"
  | "mature"
  | "mastered";
