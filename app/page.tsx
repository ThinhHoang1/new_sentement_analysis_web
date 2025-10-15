"use client";

import { useState } from "react";

type AnalyzeResponse = {
  signal: "Buy" | "Sell" | "Hold";
  score: number;
  confidence: number;
  articles: Array<{
    title: string;
    url: string;
    publishedAt: string;
    source: string;
    sentiment: "Positive" | "Negative" | "Neutral" | "Unknown";
  }>;
  windowHours: number;
  limit: number;
};

export default function HomePage() {
  const [ticker, setTicker] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<AnalyzeResponse | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setData(null);
    if (!ticker.trim()) {
      setError("Vui lòng nhập mã cổ phiếu/coin");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticker: ticker.trim() })
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || `HTTP ${res.status}`);
      }
      const json = (await res.json()) as AnalyzeResponse;
      setData(json);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ maxWidth: 880, margin: "40px auto", padding: 16 }}>
      <h1>News Sentiment Signal</h1>
      <p>Nhập mã cổ phiếu hoặc coin. Khung thời gian: 24 giờ, tối đa 10 bài.</p>
      <form onSubmit={onSubmit} style={{ display: "flex", gap: 8 }}>
        <input
          value={ticker}
          onChange={(e) => setTicker(e.target.value.toUpperCase())}
          placeholder="Ví dụ: VNM, AAPL, BTC"
          aria-label="Ticker"
          style={{ flex: 1, padding: 8 }}
        />
        <button disabled={loading} type="submit">
          {loading ? "Đang phân tích..." : "Phân tích"}
        </button>
      </form>
      {error && (
        <div style={{ color: "#b00020", marginTop: 12 }}>Lỗi: {error}</div>
      )}
      {data && (
        <section style={{ marginTop: 24 }}>
          <h2>
            Tín hiệu: {data.signal} (score {data.score.toFixed(2)}, conf {Math.round(data.confidence * 100)}%)
          </h2>
          <small>
            Window: {data.windowHours}h, limit: {data.limit}. Đây không phải là tư vấn đầu tư.
          </small>
          <ul style={{ marginTop: 16, paddingLeft: 18 }}>
            {data.articles.map((a, idx) => (
              <li key={idx} style={{ marginBottom: 8 }}>
                <a href={a.url} target="_blank" rel="noreferrer">
                  {a.title}
                </a>
                <div style={{ fontSize: 12, color: "#555" }}>
                  {a.source} • {new Date(a.publishedAt).toLocaleString()} • {a.sentiment}
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}


