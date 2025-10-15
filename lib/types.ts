export type RawArticle = {
  title: string;
  url: string;
  publishedAt: string; // ISO
  source: string;
  description?: string;
  content?: string;
};

export type ScoredArticle = RawArticle & {
  sentiment: "Positive" | "Negative" | "Neutral" | "Unknown";
  confidence: number; // 0..1
};


