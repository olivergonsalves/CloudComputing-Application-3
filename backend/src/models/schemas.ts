import { z } from "zod";

export const SearchRequestSchema = z.object({
  topic: z.string().trim().min(1).max(120)
});

export const TreeNodeSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  normalizedLabel: z.string().min(1),
  parentId: z.string().nullable(),
  depth: z.number().int().nonnegative(),
  children: z.array(z.string()),
  isExpanded: z.boolean(),
  hasLoadedChildren: z.boolean(),
  source: z.object({
    sourceLabel: z.enum(["wikipedia", "anthropic", "fallback"]),
    confidence: z.number().min(0).max(1),
    discoveredBy: z.array(z.enum(["wikipedia", "anthropic", "fallback"]))
  }),
  summary: z.string(),
  externalUrl: z.string().url(),
  summaryIsFallback: z.boolean()
});

export const TreeStateSchema = z.object({
  rootId: z.string().min(1),
  nodes: z.record(TreeNodeSchema),
  selectedNodeId: z.string().nullable()
});

export const ExpandRequestSchema = z.object({
  tree: TreeStateSchema,
  nodeId: z.string().min(1)
});

export const SaveMapRequestSchema = z.object({
  rootTopic: z.string().trim().min(1).max(120),
  tree: TreeStateSchema
});

export const TopicSummaryQuerySchema = z.object({
  topic: z.string().trim().min(1).max(120)
});

export const ClaudeChildSchema = z.object({
  label: z.string().trim().min(1).max(80),
  reason: z.string().trim().min(1).max(180)
});

export const ClaudeResponseSchema = z.object({
  children: z.array(ClaudeChildSchema).min(4).max(6)
});

export type ClaudeResponse = z.infer<typeof ClaudeResponseSchema>;
