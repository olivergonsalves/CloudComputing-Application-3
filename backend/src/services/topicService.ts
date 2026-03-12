import { generateChildTopicsWithAnthropic } from "../clients/anthropicClient.js";
import { fetchWikipediaRelatedTopics, fetchWikipediaSummary } from "../clients/wikipediaClient.js";
import { CandidateTopic, SourceLabel, TopicSummary } from "../models/types.js";
import { normalizeTopic } from "../utils/text.js";
import { withRetry } from "../utils/retry.js";
import { rankCandidates } from "./treeService.js";

interface BuildChildrenResult {
  children: Array<{
    label: string;
    summary: string;
    externalUrl: string;
    sourceLabel: "wikipedia" | "anthropic" | "fallback";
    summaryIsFallback: boolean;
  }>;
  warnings: string[];
}

export async function getTopicSummary(topic: string): Promise<TopicSummary> {
  try {
    const wiki = await withRetry(() => fetchWikipediaSummary(topic), 1);
    if (wiki) {
      return {
        title: wiki.title,
        summary: wiki.summary,
        externalUrl: wiki.canonicalUrl,
        sourceLabel: "wikipedia",
        summaryIsFallback: false
      };
    }
  } catch {
    // Fall back below if Wikipedia is unreachable.
  }

  return {
    title: topic,
    summary: `Fallback summary: Overview for ${topic}.`,
    externalUrl: `https://www.google.com/search?q=${encodeURIComponent(topic)}`,
    sourceLabel: "fallback",
    summaryIsFallback: true
  };
}

export async function buildChildrenForTopic(topic: string, ancestorTopics: string[]): Promise<BuildChildrenResult> {
  // eslint-disable-next-line no-console
  console.info(`[expand] Requested topic=\"${topic}\" ancestors=${ancestorTopics.length}`);

  const warnings: string[] = [];

  const wikiCandidatesRaw = await withRetry(() => fetchWikipediaRelatedTopics(topic), 1).catch(() => []);

  if (wikiCandidatesRaw.length === 0) {
    warnings.push("Wikipedia related-topic lookup returned no candidates.");
  }

  const candidateTopics: CandidateTopic[] = [
    ...wikiCandidatesRaw.map((label) => ({ label, reason: "Wikipedia related result", sourceLabel: "wikipedia" as const }))
  ];

  const rankedCandidates = rankCandidates(candidateTopics);

  const anthropicChildren = await withRetry(
    () =>
      generateChildTopicsWithAnthropic({
        parentTopic: topic,
        candidateTopics: rankedCandidates.map((candidate) => candidate.label),
        ancestorTopics
      }),
    1
  ).catch(() => []);

  // eslint-disable-next-line no-console
  console.info(`[expand] Anthropic parsed topics count=${anthropicChildren.length} topic=\"${topic}\"`);

  if (anthropicChildren.length === 0) {
    warnings.push("Anthropic child-topic generation unavailable; using search-only fallback.");
  }

  const modelLabels = anthropicChildren.map((child) => normalizeTopic(child.label));
  const ancestorSet = new Set(ancestorTopics.map((topicLabel) => normalizeTopic(topicLabel)));

  const preferred = anthropicChildren
    .filter((child) => {
      const normalized = normalizeTopic(child.label);
      return normalized && !ancestorSet.has(normalized);
    })
    .slice(0, 6);

  const fallbackChildren = rankedCandidates
    .filter((candidate) => {
      const normalized = normalizeTopic(candidate.label);
      return !ancestorSet.has(normalized) && !modelLabels.includes(normalized);
    })
    .slice(0, Math.max(0, 6 - preferred.length))
    .map((candidate) => ({ label: candidate.label, reason: candidate.reason }));

  const mergedLabels = [...preferred, ...fallbackChildren].slice(0, 6);

  const children = await Promise.all(
    mergedLabels.map(async (child) => {
      const summary = await getTopicSummary(child.label);
      const sourceLabel: SourceLabel = summary.sourceLabel === "fallback" ? "fallback" : summary.sourceLabel;

      return {
        label: summary.title,
        summary: summary.summary,
        externalUrl: summary.externalUrl,
        sourceLabel,
        summaryIsFallback: summary.summaryIsFallback
      };
    })
  );

  return {
    children,
    warnings
  };
}
