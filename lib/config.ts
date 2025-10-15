const WINDOW_HOURS = 24; // theo yêu cầu
const LIMIT = 10; // theo yêu cầu

export const CONFIG = {
  windowHours: WINDOW_HOURS,
  limit: LIMIT,
  newsApiKey: process.env.NEWSAPI_KEY ?? "",
  gnewsApiKey: process.env.GNEWS_API_KEY ?? "",
  geminiApiKey: process.env.GEMINI_API_KEY ?? "",
};

export function assertRuntimeEnv() {
  if (!CONFIG.geminiApiKey) throw new Error("GEMINI_API_KEY is required");
  if (!CONFIG.newsApiKey && !CONFIG.gnewsApiKey) {
    throw new Error("At least one of NEWSAPI_KEY or GNEWS_API_KEY is required");
  }
}


