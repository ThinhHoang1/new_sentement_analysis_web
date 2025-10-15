import { GoogleGenerativeAI } from "@google/generative-ai";
import { CONFIG } from "@lib/config";
import { RawArticle, ScoredArticle } from "@lib/types";

const MODEL_NAME = "gemini-2.5-flash";

function buildPrompt(articles: RawArticle[]): string {
  const items = articles.map((a, i) => `#${i + 1}\nTitle: ${a.title}\nDesc: ${a.description ?? ""}`).join("\n\n");
  return `Bạn là hệ thống phân tích tin tài chính.\n\nNhiệm vụ: Với MỖI bài, hãy trả về một dòng theo định dạng: INDEX|SENTIMENT|CONF, trong đó:\n- INDEX: số thứ tự bài như input\n- SENTIMENT: Positive | Negative | Neutral\n- CONF: số từ 0..1\n\nChỉ trả về các dòng kết quả, không giải thích.\n\nBÀI VIẾT:\n${items}`;
}

function parseResponse(text: string, articles: RawArticle[]): ScoredArticle[] {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const results: ScoredArticle[] = [];
  for (const line of lines) {
    const m = line.match(/^(\d+)\s*\|\s*(Positive|Negative|Neutral)\s*\|\s*(0(?:\.\d+)?|1(?:\.0+)?)$/i);
    if (!m) continue;
    const idx = Number(m[1]) - 1;
    const sentiment = (m[2][0].toUpperCase() + m[2].slice(1).toLowerCase()) as ScoredArticle["sentiment"];
    const confidence = Math.max(0, Math.min(1, Number(m[3])));
    const base = articles[idx];
    if (!base) continue;
    results.push({ ...base, sentiment, confidence });
  }
  // Fill missing as Unknown with low confidence
  for (let i = 0; i < articles.length; i++) {
    if (!results.find(r => r.url === articles[i].url)) {
      results.push({ ...articles[i], sentiment: "Unknown", confidence: 0 });
    }
  }
  return results;
}

export async function analyzeArticlesSentiment(articles: RawArticle[]): Promise<ScoredArticle[]> {
  if (!articles.length) return [];
  const client = new GoogleGenerativeAI(CONFIG.geminiApiKey);
  const model = client.getGenerativeModel({ model: MODEL_NAME });
  const prompt = buildPrompt(articles);
  const result = await model.generateContent(prompt);
  const text = result.response.text();
  return parseResponse(text, articles);
}


