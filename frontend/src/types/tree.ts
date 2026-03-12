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

export interface SearchResponse {
  tree: TreeState;
  warnings: string[];
}

export interface MapsResponse {
  maps: Array<{
    id: string;
    rootTopic: string;
    createdAt: string;
    updatedAt: string;
    tree: TreeState;
  }>;
}

export interface HistoryResponse {
  history: Array<{
    id: string;
    topic: string;
    timestamp: string;
  }>;
}
