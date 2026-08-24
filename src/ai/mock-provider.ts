import type { VocabularyEntry } from "@/types/vocabulary";
import type { QuestionType, QuizQuestion } from "@/types/quiz";
import type { WeaknessScore } from "@/types/statistics";
import { generateQuestion } from "@/services/quiz";
import { VOCABULARY } from "@/data/vocabulary";
import type {
  AiService,
  DailyMissionSuggestion,
  ProductionEvaluation,
  SynonymComparison,
  WeaknessAnalysis,
} from "./types";

function delay<T>(value: T, ms = 120): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

/**
 * Deterministic, no-network fallback used whenever no AI provider API key is
 * configured (see ai/index.ts). It derives its "explanations" from the
 * structured vocabulary data itself rather than free-generating text, so
 * the app is fully usable — and never wrong — with zero external calls.
 */
export class MockAiProvider implements AiService {
  readonly providerName = "mock";

  async generateVocabularyExplanation(vocab: VocabularyEntry): Promise<string> {
    const pos = vocab.partOfSpeech.join(", ");
    return delay(
      `${vocab.word}（${vocab.reading}）is a ${pos} meaning "${vocab.meaningEn.join(
        "; "
      )}". ${vocab.definitionJa}`
    );
  }

  async generateExampleSentences(vocab: VocabularyEntry, count: number): Promise<string[]> {
    const base = vocab.examples.map((e) => e.japanese);
    if (base.length >= count) return delay(base.slice(0, count));
    // Without a real model we can't safely invent new natural sentences —
    // repeat the curated ones rather than risk unnatural generated Japanese.
    const filled = Array.from({ length: count }, (_, i) => base[i % Math.max(base.length, 1)]).filter(Boolean);
    return delay(filled);
  }

  async compareSynonyms(vocab: VocabularyEntry, synonymWord: string): Promise<SynonymComparison> {
    const rel = vocab.synonyms.find((s) => s.word === synonymWord);
    return delay({
      wordA: vocab.word,
      wordB: synonymWord,
      nuanceA: vocab.definitionJa,
      nuanceB: rel?.nuance ?? "See the curated nuance note for this pair.",
      usageNote:
        rel?.nuance ?? `${vocab.word} and ${synonymWord} are close in meaning but not always interchangeable.`,
    });
  }

  async evaluateProductionSentence(
    vocab: VocabularyEntry,
    sentence: string
  ): Promise<ProductionEvaluation> {
    const usesWord = sentence.includes(vocab.word);
    const reasonableLength = sentence.trim().length >= 6;
    const score = usesWord && reasonableLength ? 70 : usesWord ? 45 : 10;
    return delay({
      grammaticallyCorrect: reasonableLength,
      usesTargetWordCorrectly: usesWord,
      natural: usesWord && reasonableLength,
      semanticFit: usesWord,
      score,
      feedback: usesWord
        ? "Baseline check passed: the sentence uses the target word and has reasonable length. (Connect a real AI provider for full grammar/naturalness feedback.)"
        : `Your sentence doesn't seem to include「${vocab.word}」. Try again, using the word directly.`,
    });
  }

  async generateQuiz(vocab: VocabularyEntry, type: QuestionType): Promise<QuizQuestion | null> {
    return delay(generateQuestion(vocab, type, VOCABULARY));
  }

  async generateDailyMission(weaknesses: WeaknessScore[]): Promise<DailyMissionSuggestion> {
    const weakest = weaknesses[0];
    const emphasizeSynonyms = weakest?.category === "synonym";
    const emphasizeCollocation = weakest?.category === "collocation";
    return delay({
      newWordsTarget: 20,
      reviewsTarget: 80,
      synonymQuestionsTarget: emphasizeSynonyms ? 15 : 8,
      collocationQuestionsTarget: emphasizeCollocation ? 15 : 8,
      rationale: weakest
        ? `Your weakest area right now is ${weakest.label} (${weakest.score}%), so today's mission leans into that.`
        : "A balanced mission across all mastery dimensions.",
    });
  }

  async analyzeWeakness(weaknesses: WeaknessScore[]): Promise<WeaknessAnalysis> {
    const critical = weaknesses.filter((w) => w.classification === "critical" || w.classification === "weak");
    return delay({
      summary:
        critical.length > 0
          ? `You're strongest overall, but ${critical.map((w) => w.label).join(", ")} ${
              critical.length > 1 ? "are" : "is"
            } holding back your overall mastery.`
          : "Your mastery dimensions are fairly balanced — keep up consistent review.",
      recommendations: critical.map(
        (w) => `Practice ${w.label.toLowerCase()} questions for your due words to close this gap.`
      ),
    });
  }
}
