import type { VocabularyEntry } from "@/types/vocabulary";
import type { QuestionType, QuizOption, QuizQuestion } from "@/types/quiz";

/** Deterministic-enough shuffle for quiz option ordering (Fisher-Yates). */
function shuffle<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function pickRandom<T>(items: T[], count: number, exclude: (item: T) => boolean = () => false): T[] {
  const pool = shuffle(items.filter((i) => !exclude(i)));
  return pool.slice(0, count);
}

function makeOptions(correctLabel: string, distractorLabels: string[]): QuizOption[] {
  const options: QuizOption[] = [
    { id: "opt-correct", label: correctLabel, isCorrect: true },
    ...distractorLabels.map((label, i) => ({ id: `opt-d${i}`, label, isCorrect: false })),
  ];
  return shuffle(options).map((opt, i) => ({ ...opt, id: `opt-${i}` }));
}

function firstMeaning(v: VocabularyEntry): string {
  return v.meaningEn[0] ?? v.word;
}

/**
 * Generate a reading question: given the kanji word, choose its correct
 * hiragana reading among plausible-looking alternatives drawn from other
 * words in the pool (same rough length, so distractors don't stand out
 * purely by being a different length).
 */
function generateReadingQuestion(vocab: VocabularyEntry, pool: VocabularyEntry[]): QuizQuestion {
  const distractors = pickRandom(
    pool,
    3,
    (v) => v.id === vocab.id || v.reading === vocab.reading
  ).map((v) => v.reading);

  // Backfill with slight mutations of the correct reading if the pool is small.
  while (distractors.length < 3) {
    const chars = vocab.reading.split("");
    const idx = Math.floor(Math.random() * chars.length);
    chars[idx] = "ん";
    const mutated = chars.join("");
    if (mutated !== vocab.reading && !distractors.includes(mutated)) distractors.push(mutated);
    else break;
  }

  return {
    id: `${vocab.id}-reading-${Date.now()}`,
    type: "reading",
    vocabularyId: vocab.id,
    prompt: vocab.word,
    options: makeOptions(vocab.reading, distractors.slice(0, 3)),
    explanation: `${vocab.word} is read「${vocab.reading}」(${vocab.romaji}).`,
  };
}

function generateMeaningQuestion(vocab: VocabularyEntry, pool: VocabularyEntry[]): QuizQuestion {
  const distractors = pickRandom(pool, 3, (v) => v.id === vocab.id).map(firstMeaning);
  return {
    id: `${vocab.id}-meaning-${Date.now()}`,
    type: "meaning",
    vocabularyId: vocab.id,
    prompt: `${vocab.word}（${vocab.reading}）`,
    options: makeOptions(firstMeaning(vocab), distractors),
    explanation: `${vocab.word} means "${vocab.meaningEn.join("; ")}".`,
  };
}

function generateContextQuestion(vocab: VocabularyEntry, pool: VocabularyEntry[]): QuizQuestion | null {
  const example = vocab.examples[0];
  if (!example) return null;
  const blanked = example.japanese.includes(vocab.word)
    ? example.japanese.replace(vocab.word, "＿＿＿＿")
    : null;
  if (!blanked) return null;

  const distractors = pickRandom(
    pool,
    3,
    (v) => v.id === vocab.id || !v.partOfSpeech.some((p) => vocab.partOfSpeech.includes(p))
  ).map((v) => v.word);

  const finalDistractors =
    distractors.length === 3
      ? distractors
      : pickRandom(pool, 3, (v) => v.id === vocab.id).map((v) => v.word);

  return {
    id: `${vocab.id}-context-${Date.now()}`,
    type: "context",
    vocabularyId: vocab.id,
    prompt: blanked,
    context: example.translationEn,
    options: makeOptions(vocab.word, finalDistractors),
    explanation: `"${example.japanese}" — ${example.translationEn}`,
  };
}

function generateSynonymQuestion(vocab: VocabularyEntry, pool: VocabularyEntry[]): QuizQuestion | null {
  const synonym = vocab.synonyms[0];
  if (!synonym) return null;
  const collocation = vocab.collocations[0];
  const prompt = collocation
    ? `「${collocation.phrase}」に最も近い意味の言葉は？`
    : `「${vocab.word}」に最も近い意味の言葉は？`;

  const distractors = pickRandom(
    pool,
    3,
    (v) => v.id === vocab.id || v.id === synonym.vocabularyId
  ).map((v) => v.word);

  return {
    id: `${vocab.id}-synonym-${Date.now()}`,
    type: "synonym",
    vocabularyId: vocab.id,
    prompt,
    options: makeOptions(synonym.word, distractors),
    explanation:
      synonym.nuance ?? `${synonym.word} is a close synonym of ${vocab.word}.`,
  };
}

function generateCollocationQuestion(vocab: VocabularyEntry, pool: VocabularyEntry[]): QuizQuestion | null {
  const collocation = vocab.collocations[0];
  if (!collocation) return null;
  const blanked = collocation.phrase.includes(vocab.word)
    ? collocation.phrase.replace(vocab.word, "＿＿＿＿")
    : `＿＿＿＿ ${collocation.phrase}`;

  const distractors = pickRandom(pool, 3, (v) => v.id === vocab.id).map((v) => v.word);

  return {
    id: `${vocab.id}-collocation-${Date.now()}`,
    type: "collocation",
    vocabularyId: vocab.id,
    prompt: blanked,
    context: collocation.translationEn,
    options: makeOptions(vocab.word, distractors),
    explanation: `Natural collocation: 「${collocation.phrase}」 — ${collocation.translationEn}`,
  };
}

function generateConfusingWordQuestion(vocab: VocabularyEntry, pool: VocabularyEntry[]): QuizQuestion | null {
  const confusing = vocab.confusingWords[0];
  if (!confusing) return null;
  const example = vocab.examples[0];
  const prompt = example
    ? example.japanese.replace(vocab.word, "＿＿＿＿")
    : `次のうち、文脈に最も合う言葉はどれですか？（${vocab.meaningEn[0]}）`;

  const extraDistractors = pickRandom(
    pool,
    2,
    (v) => v.id === vocab.id || v.id === confusing.vocabularyId
  ).map((v) => v.word);

  return {
    id: `${vocab.id}-confusing-${Date.now()}`,
    type: "confusing-word",
    vocabularyId: vocab.id,
    prompt,
    context: example?.translationEn,
    options: makeOptions(vocab.word, [confusing.word, ...extraDistractors].slice(0, 3)),
    explanation: confusing.distinction,
  };
}

function generateProductionPrompt(vocab: VocabularyEntry): QuizQuestion {
  return {
    id: `${vocab.id}-production-${Date.now()}`,
    type: "production",
    vocabularyId: vocab.id,
    prompt: `「${vocab.word}」を使って文を作ってください。`,
    context: vocab.examples[0]?.japanese,
    options: [],
    explanation: vocab.examples[0]
      ? `Example: ${vocab.examples[0].japanese} — ${vocab.examples[0].translationEn}`
      : `Meaning: ${vocab.meaningEn.join("; ")}`,
  };
}

const GENERATORS: Record<
  QuestionType,
  (vocab: VocabularyEntry, pool: VocabularyEntry[]) => QuizQuestion | null
> = {
  reading: generateReadingQuestion,
  meaning: generateMeaningQuestion,
  context: generateContextQuestion,
  synonym: generateSynonymQuestion,
  collocation: generateCollocationQuestion,
  "confusing-word": generateConfusingWordQuestion,
  production: (v) => generateProductionPrompt(v),
};

/**
 * Generate one quiz question of the requested type. Falls back to a
 * "meaning" question (always generatable, given at least 4 pool entries) if
 * the requested type can't be built for this word (e.g. no synonyms on
 * record yet).
 */
export function generateQuestion(
  vocab: VocabularyEntry,
  type: QuestionType,
  pool: VocabularyEntry[]
): QuizQuestion {
  const question = GENERATORS[type](vocab, pool);
  if (question) return question;
  return generateMeaningQuestion(vocab, pool);
}

export function scoreProductionSentence(vocab: VocabularyEntry, sentence: string) {
  // Deterministic, non-AI baseline check used when no AI provider is configured
  // (see ai/service.ts) — real semantic evaluation is delegated to the AI layer.
  const containsWord = sentence.includes(vocab.word);
  const reasonableLength = sentence.trim().length >= 6;
  return {
    containsTargetWord: containsWord,
    plausibleLength: reasonableLength,
    passesBaselineCheck: containsWord && reasonableLength,
  };
}
