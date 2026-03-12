import Anthropic from "@anthropic-ai/sdk";
import { env } from "../config/env.js";
import { ClaudeResponseSchema } from "../models/schemas.js";

const MODEL_CANDIDATES = [
  "claude-haiku-4-5-20251001",
  "claude-3-5-haiku-latest",
  "claude-3-5-haiku-20241022",
  "claude-3-haiku-20240307"
] as const;

interface ClaudeInput {
  parentTopic: string;
  candidateTopics: string[];
  ancestorTopics: string[];
}

export async function generateChildTopicsWithAnthropic(input: ClaudeInput): Promise<Array<{ label: string; reason: string }>> {
  if (!env.anthropicApiKey) {
    // eslint-disable-next-line no-console
    console.error("[anthropic] Missing ANTHROPIC_API_KEY.");
    return [];
  }

  const anthropic = new Anthropic({ apiKey: env.anthropicApiKey });

  const systemPrompt = [
    "You generate strict JSON for topic expansion in a hierarchical knowledge tree.",
    "Return only directly relevant, branch-worthy child concepts.",
    "Avoid duplicates, avoid vague terms, avoid parent repeats and ancestors.",
    "Keep labels concise (1-5 words).",
    "Return strict JSON with shape: {\"children\":[{\"label\":string,\"reason\":string}]} and nothing else."
  ].join(" ");

  const userPrompt = {
    parentTopic: input.parentTopic,
    ancestorTopics: input.ancestorTopics,
    candidateTopics: input.candidateTopics,
    constraints: {
      minChildren: 4,
      maxChildren: 6,
      mustBeSpecific: true,
      noDuplicates: true
    }
  };

  const selectedModel = env.anthropicModel || MODEL_CANDIDATES[0];
  // eslint-disable-next-line no-console
  console.info(`[anthropic] Request sent for topic=\"${input.parentTopic}\" model=\"${selectedModel}\"`);

  try {
    const response = await createMessageWithModelFallback(anthropic, {
      model: selectedModel,
      max_tokens: 600,
      temperature: 0.2,
      thinking: { type: "disabled" },
      system: systemPrompt,
      messages: [{ role: "user", content: JSON.stringify(userPrompt) }]
    });

    const firstBlock = response.content[0];
    const text =
      (firstBlock?.type === "text" ? firstBlock.text : undefined)?.trim() ??
      response.content.find((item) => item.type === "text")?.text?.trim();
    if (!text) {
      // eslint-disable-next-line no-console
      console.error("[anthropic] No text content returned by model.");
      return [];
    }

    // eslint-disable-next-line no-console
    console.info(`[anthropic] Raw response received: ${text.slice(0, 500)}`);

    const parsedJson = safelyExtractJson(text);
    const normalized = normalizeAnthropicJson(parsedJson);
    const parsed = ClaudeResponseSchema.safeParse(normalized);
    if (!parsed.success) {
      // eslint-disable-next-line no-console
      console.error("[anthropic] JSON parsing/validation failed.", parsed.error.flatten());
      return [];
    }

    // eslint-disable-next-line no-console
    console.info(`[anthropic] Parsed ${parsed.data.children.length} child topics.`);
    return parsed.data.children;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("[anthropic] API error while generating topics.", error);
    return [];
  }
}

export async function testAnthropicRequest(promptTopic: string): Promise<unknown> {
  if (!env.anthropicApiKey) {
    throw new Error("Missing ANTHROPIC_API_KEY");
  }

  const anthropic = new Anthropic({ apiKey: env.anthropicApiKey });
  const selectedModel = env.anthropicModel || MODEL_CANDIDATES[0];

  const response = await createMessageWithModelFallback(anthropic, {
    model: selectedModel,
    max_tokens: 300,
    temperature: 0.2,
    thinking: { type: "disabled" },
    messages: [
      {
        role: "user",
        content:
          `Generate 5 related topics for ${promptTopic}. ` +
          `Return ONLY valid JSON array of objects with a \"topic\" field.`
      }
    ]
  });

  return {
    id: response.id,
    model: response.model,
    role: response.role,
    content: response.content,
    stop_reason: response.stop_reason,
    usage: response.usage
  };
}

async function createMessageWithModelFallback(
  anthropic: Anthropic,
  request: Anthropic.Messages.MessageCreateParamsNonStreaming
): Promise<Anthropic.Messages.Message> {
  const uniqueModels = Array.from(new Set([request.model, ...MODEL_CANDIDATES]));
  let lastError: unknown;

  for (const model of uniqueModels) {
    try {
      if (model !== request.model) {
        // eslint-disable-next-line no-console
        console.info(`[anthropic] Retrying request with fallback model \"${model}\"`);
      }

      return await anthropic.messages.create({
        ...request,
        model
      });
    } catch (error) {
      lastError = error;
      if (!isModelNotFoundError(error)) {
        throw error;
      }

      // eslint-disable-next-line no-console
      console.error(`[anthropic] Model \"${model}\" unavailable for this API key.`);
    }
  }

  throw lastError;
}

function isModelNotFoundError(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }

  const status = (error as { status?: number }).status;
  const message = "message" in error ? String((error as { message?: unknown }).message ?? "") : "";
  return status === 404 || message.includes("not_found_error") || message.includes("model:");
}

function safelyExtractJson(text: string): unknown {
  const fencedMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const payload = fencedMatch?.[1]?.trim() || text.trim();

  const arrayStart = payload.indexOf("[");
  const arrayEnd = payload.lastIndexOf("]");
  const objectStart = payload.indexOf("{");
  const objectEnd = payload.lastIndexOf("}");

  const candidates: string[] = [];
  if (arrayStart !== -1 && arrayEnd !== -1 && arrayEnd > arrayStart) {
    candidates.push(payload.slice(arrayStart, arrayEnd + 1));
  }
  if (objectStart !== -1 && objectEnd !== -1 && objectEnd > objectStart) {
    candidates.push(payload.slice(objectStart, objectEnd + 1));
  }

  for (const candidate of candidates) {
    try {
      return JSON.parse(candidate);
    } catch {
      continue;
    }
  }

  return {};
}

function normalizeAnthropicJson(input: unknown): unknown {
  if (Array.isArray(input)) {
    const children = input
      .map((item) => {
        if (!item || typeof item !== "object") {
          return null;
        }

        const maybeTopic = "topic" in item ? String((item as { topic?: unknown }).topic ?? "").trim() : "";
        const maybeLabel = "label" in item ? String((item as { label?: unknown }).label ?? "").trim() : "";
        const label = maybeLabel || maybeTopic;
        if (!label) {
          return null;
        }

        const reason = "reason" in item ? String((item as { reason?: unknown }).reason ?? "").trim() : "Related topic";
        return { label, reason };
      })
      .filter((item): item is { label: string; reason: string } => Boolean(item));

    return { children };
  }

  return input;
}
