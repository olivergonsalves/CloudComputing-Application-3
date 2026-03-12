import { Request, Response } from "express";
import { ExpandRequestSchema, SearchRequestSchema, TopicSummaryQuerySchema } from "../models/schemas.js";
import { testAnthropicRequest } from "../clients/anthropicClient.js";
import { addHistory } from "../services/historyService.js";
import { buildChildrenForTopic, getTopicSummary } from "../services/topicService.js";
import { collectAncestorLabels, createInitialTree, mergeChildrenIntoTree, toggleExpanded } from "../services/treeService.js";

export async function searchTopic(req: Request, res: Response): Promise<void> {
  try {
    const parsed = SearchRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid request", details: parsed.error.flatten() });
      return;
    }

    const topic = parsed.data.topic.trim();
    const root = await getTopicSummary(topic);
    const childrenData = await buildChildrenForTopic(root.title, [root.title]);

    const tree = createInitialTree(root, childrenData.children);
    await addHistory(root.title);

    res.json({ tree, warnings: childrenData.warnings });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Search request failed";
    res.status(500).json({ error: message });
  }
}

export async function expandTopicNode(req: Request, res: Response): Promise<void> {
  try {
    const parsed = ExpandRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid request", details: parsed.error.flatten() });
      return;
    }

    const { tree, nodeId } = parsed.data;
    const node = tree.nodes[nodeId];

    if (!node) {
      res.status(404).json({ error: "Node not found" });
      return;
    }

    if (node.hasLoadedChildren) {
      const toggled = toggleExpanded(tree, nodeId);
      res.json({ tree: toggled, warnings: [] });
      return;
    }

    const ancestors = collectAncestorLabels(tree, nodeId);
    const childrenData = await buildChildrenForTopic(node.label, ancestors);

    const expandedTree = mergeChildrenIntoTree(tree, nodeId, childrenData.children);
    expandedTree.selectedNodeId = nodeId;

    res.json({ tree: expandedTree, warnings: childrenData.warnings });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Expand request failed";
    res.status(500).json({ error: message });
  }
}

export async function topicSummary(req: Request, res: Response): Promise<void> {
  try {
    const parsed = TopicSummaryQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid query", details: parsed.error.flatten() });
      return;
    }

    const summary = await getTopicSummary(parsed.data.topic);
    res.json(summary);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Topic summary request failed";
    res.status(500).json({ error: message });
  }
}

export async function testAnthropic(req: Request, res: Response): Promise<void> {
  try {
    const topic = typeof req.query.topic === "string" && req.query.topic.trim() ? req.query.topic.trim() : "Artificial Intelligence";
    const raw = await testAnthropicRequest(topic);
    res.json({ ok: true, topic, raw });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Anthropic test request failed";
    res.status(500).json({ ok: false, error: message });
  }
}
