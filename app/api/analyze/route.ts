import { NextRequest, NextResponse } from "next/server";
import { fetchRecentNews } from "@lib/news";
import { analyzeArticlesSentiment } from "@lib/sentiment";
import { aggregateSignal } from "@lib/signal";
import { CONFIG } from "@lib/config";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const tickerRaw = (body?.ticker as string | undefined) ?? "";
    const ticker = tickerRaw.trim();
    if (!ticker) {
      return NextResponse.json({ error: "Ticker is required" }, { status: 400 });
    }

    const sinceMs = Date.now() - CONFIG.windowHours * 60 * 60 * 1000;
    const articles = await fetchRecentNews({
      query: ticker,
      since: new Date(sinceMs).toISOString(),
      limit: CONFIG.limit
    });

    if (articles.length === 0) {
      return NextResponse.json({
        signal: "Hold",
        score: 0,
        confidence: 0,
        articles: [],
        windowHours: CONFIG.windowHours,
        limit: CONFIG.limit
      });
    }

    const analyzed = await analyzeArticlesSentiment(articles);
    const { signal, score, confidence } = aggregateSignal(analyzed);

    return NextResponse.json({
      signal,
      score,
      confidence,
      articles: analyzed.map(a => ({
        title: a.title,
        url: a.url,
        publishedAt: a.publishedAt,
        source: a.source,
        sentiment: a.sentiment
      })),
      windowHours: CONFIG.windowHours,
      limit: CONFIG.limit
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}


