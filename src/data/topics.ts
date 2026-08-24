import type { VocabularyTopic } from "@/types";

export const TOPIC_LABELS: Record<VocabularyTopic, string> = {
  politics: "Politics",
  economics: "Economics",
  business: "Business",
  finance: "Finance",
  society: "Society",
  education: "Education",
  science: "Science",
  technology: "Technology",
  environment: "Environment",
  medicine: "Medicine",
  law: "Law",
  psychology: "Psychology",
  culture: "Culture",
  journalism: "Journalism",
  employment: "Employment",
  academic: "Academic Japanese",
  "abstract-concepts": "Abstract Concepts",
  emotion: "Emotion",
  relationships: "Human Relationships",
  "formal-written": "Formal Written Japanese",
  news: "News Japanese",
};

export const ALL_TOPICS = Object.keys(TOPIC_LABELS) as VocabularyTopic[];
