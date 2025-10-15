import { CONFIG } from "@lib/config";
import { dedupeByUrl, withBackoff } from "@lib/utils";
import { RawArticle } from "@lib/types";

type FetchParams = {
  query: string;
  since: string; // ISO
  limit: number;
};

async function fetchNewsapi(params: FetchParams): Promise<RawArticle[]> {
  if (!CONFIG.newsApiKey) return [];
  const url = new URL("https://newsapi.org/v2/everything");
  url.searchParams.set("q", params.query);
  url.searchParams.set("from", params.since);
  url.searchParams.set("pageSize", String(Math.min(params.limit, 100)));
  url.searchParams.set("sortBy", "publishedAt");
  url.searchParams.set("language", "en");
  const res = await withBackoff(() => fetch(url, {
    headers: { Authorization: `Bearer ${CONFIG.newsApiKey}` }
  }));
  if (!res.ok) return [];
  const json = await res.json();
  const items = (json.articles ?? []) as any[];
  return items.map((a) => ({
    title: a.title ?? "",
    url: a.url ?? "",
    publishedAt: a.publishedAt ?? new Date().toISOString(),
    source: a.source?.name ?? "NewsAPI",
    description: a.description ?? undefined,
    content: a.content ?? undefined,
  }));
}

async function fetchGnews(params: FetchParams): Promise<RawArticle[]> {
  if (!CONFIG.gnewsApiKey) return [];
  const url = new URL("https://gnews.io/api/v4/search");
  url.searchParams.set("q", params.query);
  url.searchParams.set("from", params.since);
  url.searchParams.set("lang", "vi,en");
  url.searchParams.set("max", String(Math.min(params.limit, 10)));
  url.searchParams.set("sortby", "publishedAt");
  url.searchParams.set("token", CONFIG.gnewsApiKey);
  const res = await withBackoff(() => fetch(url));
  if (!res.ok) return [];
  const json = await res.json();
  const items = (json.articles ?? []) as any[];
  return items.map((a) => ({
    title: a.title ?? "",
    url: a.url ?? "",
    publishedAt: a.publishedAt ?? new Date().toISOString(),
    source: a.source?.name ?? "GNews",
    description: a.description ?? undefined,
    content: a.content ?? undefined,
  }));
}

export async function fetchRecentNews(params: FetchParams): Promise<RawArticle[]> {
  const [n1, n2] = await Promise.all([
    fetchNewsapi(params),
    fetchGnews(params)
  ]);
  const merged = dedupeByUrl([...n1, ...n2])
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
    .slice(0, params.limit);
  return merged;
}


