export type SourceLabel = "wikipedia" | "anthropic" | "fallback";

export interface TopicSourceMetadata {
  sourceLabel: SourceLabel;
  confidence: number;
  discoveredBy: SourceLabel[];
}

export interface TreeNode {
  id: string;
  label: string;
  normalizedLabel: string;
  parentId: string | null;
  depth: number;
  children: string[];
  isExpanded: boolean;
  hasLoadedChildren: boolean;
  source: TopicSourceMetadata;
  summary: string;
  externalUrl: string;
  summaryIsFallback: boolean;
}

export interface TreeState {
  rootId: string;
  nodes: Record<string, TreeNode>;
  selectedNodeId: string | null;
}

export interface SearchRequest {
  topic: string;
}

export interface ExpandRequest {
  tree: TreeState;
  nodeId: string;
}

export interface SaveMapRequest {
  rootTopic: string;
  tree: TreeState;
}

export interface SavedMap {
  id: string;
  rootTopic: string;
  createdAt: string;
  updatedAt: string;
  tree: TreeState;
}

export interface SearchHistoryItem {
  id: string;
  topic: string;
  timestamp: string;
}

export interface TopicSummary {
  title: string;
  summary: string;
  externalUrl: string;
  sourceLabel: SourceLabel;
  summaryIsFallback: boolean;
}

export interface CandidateTopic {
  label: string;
  reason: string;
  sourceLabel: SourceLabel;
}
