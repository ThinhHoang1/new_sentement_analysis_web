import { ScoredArticle } from "@lib/types";

function scoreOf(sent: ScoredArticle["sentiment"]): number {
  if (sent === "Positive") return 1;
  if (sent === "Negative") return -1;
  return 0;
}

export function aggregateSignal(articles: ScoredArticle[]): { signal: "Buy" | "Sell" | "Hold"; score: number; confidence: number } {
  if (articles.length < 5) {
    return { signal: "Hold", score: 0, confidence: 0.2 };
  }
  const now = Date.now();
  let total = 0;
  let weightSum = 0;
  let pos = 0, neg = 0;
  for (const a of articles) {
    const hoursOld = Math.max(0.1, (now - new Date(a.publishedAt).getTime()) / 3600000);
    const recencyWeight = 1 / hoursOld; // bài mới nặng hơn
    const w = recencyWeight * (0.5 + 0.5 * a.confidence);
    const s = scoreOf(a.sentiment);
    total += s * w;
    weightSum += w;
    if (s > 0) pos++; else if (s < 0) neg++;
  }
  const score = weightSum > 0 ? total / weightSum : 0;
  const posRatio = pos / articles.length;
  const negRatio = neg / articles.length;
  let signal: "Buy" | "Sell" | "Hold" = "Hold";
  if (score >= 0.25 && posRatio >= 0.6) signal = "Buy";
  else if (score <= -0.25 && negRatio >= 0.6) signal = "Sell";
  const confidence = Math.min(1, Math.max(0.2, Math.abs(score)));
  return { signal, score, confidence };
}


