import { HistoryResponse, MapsResponse, SearchResponse, TreeState } from "../types/tree";
import { z } from "zod";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000";

const sourceLabelSchema = z.enum(["wikipedia", "anthropic", "fallback"]);

const treeNodeSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  normalizedLabel: z.string().min(1),
  parentId: z.string().nullable(),
  depth: z.number().int().nonnegative(),
  children: z.array(z.string()),
  isExpanded: z.boolean(),
  hasLoadedChildren: z.boolean(),
  source: z.object({
    sourceLabel: sourceLabelSchema,
    confidence: z.number().min(0).max(1),
    discoveredBy: z.array(sourceLabelSchema)
  }),
  summary: z.string(),
  externalUrl: z.string().url(),
  summaryIsFallback: z.boolean()
});

const treeStateSchema = z.object({
  rootId: z.string().min(1),
  nodes: z.record(treeNodeSchema),
  selectedNodeId: z.string().nullable()
});

const searchResponseSchema = z.object({
  tree: treeStateSchema,
  warnings: z.array(z.string())
});

const mapsResponseSchema = z.object({
  maps: z.array(
    z.object({
      id: z.string(),
      rootTopic: z.string(),
      createdAt: z.string(),
      updatedAt: z.string(),
      tree: treeStateSchema
    })
  )
});

const historyResponseSchema = z.object({
  history: z.array(
    z.object({
      id: z.string(),
      topic: z.string(),
      timestamp: z.string()
    })
  )
});

async function request<TSchema extends z.ZodTypeAny>(path: string, schema: TSchema, init?: RequestInit): Promise<z.infer<TSchema>> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...(init?.headers ?? {})
    }
  });

  if (!response.ok) {
    const text = await response.text();
    const parsedMessage = safelyExtractErrorMessage(text);
    throw new Error(parsedMessage || `Request failed: ${response.status}`);
  }

  const payload = (await response.json()) as unknown;
  const parsed = schema.safeParse(payload);
  if (!parsed.success) {
    throw new Error("Malformed API response");
  }

  return parsed.data;
}

function safelyExtractErrorMessage(text: string): string {
  if (!text) {
    return "";
  }

  try {
    const parsed = JSON.parse(text) as { error?: unknown };
    return typeof parsed.error === "string" ? parsed.error : text;
  } catch {
    return text;
  }
}

export function searchTopic(topic: string, signal?: AbortSignal): Promise<SearchResponse> {
  return request("/api/search", searchResponseSchema, {
    method: "POST",
    signal,
    body: JSON.stringify({ topic })
  });
}

export function expandNode(tree: TreeState, nodeId: string, signal?: AbortSignal): Promise<SearchResponse> {
  return request("/api/expand", searchResponseSchema, {
    method: "POST",
    signal,
    body: JSON.stringify({ tree, nodeId })
  });
}

export function saveMap(rootTopic: string, tree: TreeState): Promise<{ map: unknown }> {
  return request("/api/maps", z.object({ map: z.unknown() }), {
    method: "POST",
    body: JSON.stringify({ rootTopic, tree })
  }) as Promise<{ map: unknown }>;
}

export function getMaps(): Promise<MapsResponse> {
  return request("/api/maps", mapsResponseSchema);
}

export function getHistory(): Promise<HistoryResponse> {
  return request("/api/history", historyResponseSchema);
}
