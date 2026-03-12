import { CandidateTopic, TopicSummary, TreeNode, TreeState } from "../models/types.js";
import { createId } from "../utils/id.js";
import { normalizeTopic } from "../utils/text.js";

interface ChildInput {
  label: string;
  summary: string;
  externalUrl: string;
  sourceLabel: "wikipedia" | "anthropic" | "fallback";
  summaryIsFallback: boolean;
}

export function createNode(params: {
  label: string;
  parentId: string | null;
  depth: number;
  summary: string;
  externalUrl: string;
  sourceLabel: "wikipedia" | "anthropic" | "fallback";
  summaryIsFallback?: boolean;
}): TreeNode {
  const discoveredBy = [params.sourceLabel];

  return {
    id: createId(),
    label: params.label,
    normalizedLabel: normalizeTopic(params.label),
    parentId: params.parentId,
    depth: params.depth,
    children: [],
    isExpanded: false,
    hasLoadedChildren: false,
    source: {
      sourceLabel: params.sourceLabel,
      confidence: params.sourceLabel === "fallback" ? 0.45 : 0.8,
      discoveredBy
    },
    summary: params.summary,
    externalUrl: params.externalUrl,
    summaryIsFallback: params.summaryIsFallback ?? false
  };
}

export function createInitialTree(root: TopicSummary, children: ChildInput[]): TreeState {
  const rootNode = createNode({
    label: root.title,
    parentId: null,
    depth: 0,
    summary: root.summary,
    externalUrl: root.externalUrl,
    sourceLabel: root.sourceLabel,
    summaryIsFallback: root.summaryIsFallback
  });

  rootNode.isExpanded = true;

  const nodes: Record<string, TreeNode> = {
    [rootNode.id]: rootNode
  };

  const uniqueByLabel = new Set<string>([rootNode.normalizedLabel]);

  for (const child of children) {
    const normalized = normalizeTopic(child.label);
    if (!normalized || uniqueByLabel.has(normalized)) {
      continue;
    }

    uniqueByLabel.add(normalized);

    const childNode = createNode({
      label: child.label,
      parentId: rootNode.id,
      depth: 1,
      summary: child.summary,
      externalUrl: child.externalUrl,
      sourceLabel: child.sourceLabel,
      summaryIsFallback: child.summaryIsFallback
    });

    nodes[childNode.id] = childNode;
    rootNode.children.push(childNode.id);
  }

  rootNode.hasLoadedChildren = true;

  return {
    rootId: rootNode.id,
    nodes,
    selectedNodeId: rootNode.id
  };
}

export function collectAncestorLabels(tree: TreeState, nodeId: string): string[] {
  const labels: string[] = [];
  let cursor = tree.nodes[nodeId];

  while (cursor) {
    labels.push(cursor.label);
    if (!cursor.parentId) {
      break;
    }
    cursor = tree.nodes[cursor.parentId];
  }

  return labels.reverse();
}

export function collectGlobalLabelSet(tree: TreeState): Set<string> {
  return new Set(Object.values(tree.nodes).map((node) => node.normalizedLabel));
}

export function mergeChildrenIntoTree(tree: TreeState, parentId: string, children: ChildInput[]): TreeState {
  const currentParent = tree.nodes[parentId];
  if (!currentParent) {
    return tree;
  }

  const parentClone: TreeNode = {
    ...currentParent,
    children: [...currentParent.children]
  };

  const nextTree: TreeState = {
    ...tree,
    nodes: { ...tree.nodes, [parentId]: parentClone }
  };

  const existingGlobal = collectGlobalLabelSet(nextTree);
  const existingUnderParent = new Set(parentClone.children.map((childId) => nextTree.nodes[childId]?.normalizedLabel).filter(Boolean));

  for (const child of children) {
    const normalized = normalizeTopic(child.label);
    if (!normalized || existingUnderParent.has(normalized) || existingGlobal.has(normalized)) {
      continue;
    }

    const node = createNode({
      label: child.label,
      parentId,
      depth: parentClone.depth + 1,
      summary: child.summary,
      externalUrl: child.externalUrl,
      sourceLabel: child.sourceLabel,
      summaryIsFallback: child.summaryIsFallback
    });

    nextTree.nodes[node.id] = node;
    parentClone.children.push(node.id);
    existingUnderParent.add(normalized);
    existingGlobal.add(normalized);
  }

  parentClone.hasLoadedChildren = true;
  parentClone.isExpanded = true;

  return nextTree;
}

export function toggleExpanded(tree: TreeState, nodeId: string): TreeState {
  const nextTree: TreeState = {
    ...tree,
    nodes: { ...tree.nodes }
  };

  const node = nextTree.nodes[nodeId];
  if (!node) {
    return tree;
  }

  nextTree.nodes[nodeId] = {
    ...node,
    isExpanded: !node.isExpanded
  };

  nextTree.selectedNodeId = nodeId;

  return nextTree;
}

export function rankCandidates(input: CandidateTopic[]): CandidateTopic[] {
  const seen = new Set<string>();
  const ranked: CandidateTopic[] = [];

  for (const item of input) {
    const normalized = normalizeTopic(item.label);
    if (!normalized || normalized.length < 2 || seen.has(normalized)) {
      continue;
    }

    seen.add(normalized);
    ranked.push(item);
  }

  return ranked.slice(0, 14);
}
