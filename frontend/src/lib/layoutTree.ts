import { Edge, MarkerType, Node, Position } from "@xyflow/react";
import { TreeState } from "../types/tree";

const MIN_NODE_WIDTH = 190;
const CHAR_WIDTH = 7.4;
const NODE_HEIGHT = 64;
const HORIZONTAL_GAP = 32;
const LEVEL_GAP = 128;

interface Measured {
  id: string;
  width: number;
  subtreeWidth: number;
  children: Measured[];
}

function getVisibleChildren(tree: TreeState, nodeId: string): string[] {
  const node = tree.nodes[nodeId];
  if (!node || !node.isExpanded) {
    return [];
  }

  return node.children.filter((childId) => Boolean(tree.nodes[childId]));
}

function estimateLabelWidth(label: string): number {
  return Math.max(MIN_NODE_WIDTH, Math.ceil(label.length * CHAR_WIDTH + 46));
}

function measureTree(tree: TreeState, nodeId: string): Measured {
  const node = tree.nodes[nodeId];
  const width = estimateLabelWidth(node.label);
  const childIds = getVisibleChildren(tree, nodeId);
  const children = childIds.map((childId) => measureTree(tree, childId));

  if (children.length === 0) {
    return { id: nodeId, width, subtreeWidth: width, children };
  }

  const childrenTotal = children.reduce((sum, child) => sum + child.subtreeWidth, 0) + HORIZONTAL_GAP * (children.length - 1);

  return {
    id: nodeId,
    width,
    subtreeWidth: Math.max(width, childrenTotal),
    children
  };
}

interface Positioned {
  id: string;
  x: number;
  y: number;
}

function assignPositions(measured: Measured, depth: number, leftX: number, positions: Positioned[]): void {
  const centerX = leftX + measured.subtreeWidth / 2;
  const nodeX = centerX - measured.width / 2;
  positions.push({ id: measured.id, x: nodeX, y: depth * LEVEL_GAP });

  if (measured.children.length === 0) {
    return;
  }

  const childrenTotal = measured.children.reduce((sum, child) => sum + child.subtreeWidth, 0) + HORIZONTAL_GAP * (measured.children.length - 1);
  let cursor = centerX - childrenTotal / 2;

  for (const child of measured.children) {
    assignPositions(child, depth + 1, cursor, positions);
    cursor += child.subtreeWidth + HORIZONTAL_GAP;
  }
}

export function buildFlowElements(tree: TreeState): { nodes: Node[]; edges: Edge[] } {
  const root = tree.nodes[tree.rootId];
  if (!root) {
    return { nodes: [], edges: [] };
  }

  const measured = measureTree(tree, tree.rootId);
  const positions: Positioned[] = [];
  assignPositions(measured, 0, 0, positions);

  const posById = new Map(positions.map((entry) => [entry.id, entry]));
  const visibleNodeIds = new Set(positions.map((entry) => entry.id));

  const nodes: Node[] = positions.map((entry) => {
    const node = tree.nodes[entry.id];
    const width = estimateLabelWidth(node.label);

    return {
      id: node.id,
      data: {
        label: node.label,
        node,
        isSelected: tree.selectedNodeId === node.id
      },
      position: { x: entry.x, y: entry.y },
      type: "topicNode",
      draggable: false,
      selectable: true,
      sourcePosition: Position.Bottom,
      targetPosition: Position.Top,
      width,
      height: NODE_HEIGHT
    };
  });

  const edges: Edge[] = [];
  for (const node of Object.values(tree.nodes)) {
    if (!visibleNodeIds.has(node.id)) {
      continue;
    }

    for (const childId of node.children) {
      if (!visibleNodeIds.has(childId)) {
        continue;
      }

      if (!posById.has(node.id) || !posById.has(childId)) {
        continue;
      }

      edges.push({
        id: `e-${node.id}-${childId}`,
        source: node.id,
        target: childId,
        type: "smoothstep",
        animated: false,
        style: { stroke: "#3b3b3b", strokeWidth: 1.2 },
        markerEnd: { type: MarkerType.ArrowClosed, width: 14, height: 14, color: "#3b3b3b" }
      });
    }
  }

  return { nodes, edges };
}
