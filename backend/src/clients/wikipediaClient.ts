import { env } from "../config/env.js";
import { cleanSummary } from "../utils/text.js";

interface WikipediaSummaryResult {
  title: string;
  summary: string;
  canonicalUrl: string;
}

export async function fetchWikipediaSummary(topic: string): Promise<WikipediaSummaryResult | null> {
  const url = new URL(env.wikipediaApiBase);
  url.searchParams.set("action", "query");
  url.searchParams.set("prop", "extracts|info");
  url.searchParams.set("inprop", "url");
  url.searchParams.set("exintro", "1");
  url.searchParams.set("explaintext", "1");
  url.searchParams.set("redirects", "1");
  url.searchParams.set("titles", topic);
  url.searchParams.set("format", "json");
  url.searchParams.set("origin", "*");

  const response = await fetch(url, { headers: { "User-Agent": "Rabbit-Hole-App/1.0" } });
  if (!response.ok) {
    return null;
  }

  const data = (await response.json()) as {
    query?: {
      pages?: Record<string, { title?: string; extract?: string; fullurl?: string; missing?: string }>;
    };
  };

  const pages = data.query?.pages;
  if (!pages) {
    return null;
  }

  const first = Object.values(pages)[0];
  if (!first || first.missing !== undefined) {
    return null;
  }

  const summary = cleanSummary(first.extract ?? "");
  if (!summary) {
    return null;
  }

  return {
    title: first.title ?? topic,
    summary,
    canonicalUrl: first.fullurl ?? `https://en.wikipedia.org/wiki/${encodeURIComponent(topic.replace(/\s+/g, "_"))}`
  };
}

export async function fetchWikipediaRelatedTopics(topic: string, limit = 10): Promise<string[]> {
  const url = new URL(env.wikipediaApiBase);
  url.searchParams.set("action", "query");
  url.searchParams.set("list", "search");
  url.searchParams.set("srsearch", topic);
  url.searchParams.set("srlimit", String(limit));
  url.searchParams.set("format", "json");
  url.searchParams.set("origin", "*");

  const response = await fetch(url, { headers: { "User-Agent": "Rabbit-Hole-App/1.0" } });
  if (!response.ok) {
    return [];
  }

  const data = (await response.json()) as {
    query?: { search?: Array<{ title?: string }> };
  };

  return (data.query?.search ?? [])
    .map((item) => item.title?.trim())
    .filter((title): title is string => Boolean(title));
}
