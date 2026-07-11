import {
  completeSimple,
  getEnvApiKey,
  getModels,
  registerApiProvider,
  type Message,
  type Model,
  type ThinkingLevel,
} from "@earendil-works/pi-ai";
import { createGatewayProvider } from "@ai-sdk/gateway";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { embedMany, generateObject } from "ai";
import {
  streamAnthropic,
  streamSimpleAnthropic,
} from "@earendil-works/pi-ai/anthropic";
import {
  streamOpenAICompletions,
  streamSimpleOpenAICompletions,
} from "@earendil-works/pi-ai/openai-completions";

// Directly register the anthropic provider at import time. pi-ai's built-in
// registration relies on opaque dynamic import() calls that break under
// Nitro's rolldown bundler (the lazy import paths resolve relative to the
// bundled chunk, not the original module).
registerApiProvider({
  api: "anthropic-messages",
  stream: streamAnthropic,
  streamSimple: streamSimpleAnthropic,
});
registerApiProvider({
  api: "openai-completions",
  stream: streamOpenAICompletions,
  streamSimple: streamSimpleOpenAICompletions,
});
import type { ZodTypeAny, z } from "zod";
import {
  extractGenAiUsageAttributes,
  serializeGenAiAttribute,
} from "@/chat/logging";
import {
  logException,
  logWarn,
  setSpanAttributes,
  withSpan,
  type LogContext,
} from "@/chat/logging";
import { toOptionalTrimmed } from "@/chat/optional-string";
import {
  getCurrentConversationPrivacy,
  resolveConversationPrivacy,
  toCanonicalInputMessage,
  toCanonicalOutputMessage,
  toGenAiMessageMetadata,
  toGenAiMessagesTraceAttributes,
  toGenAiTextMetadata,
} from "@/chat/conversation-privacy";
import {
  createProviderError,
  isProviderRetryError,
} from "@/chat/services/provider-retry";

export type AiProvider = "openrouter" | "vercel-ai-gateway";

/** Resolve the configured host AI provider. */
export function resolveAiProvider(
  rawValue: string | undefined = process.env.AI_PROVIDER,
): AiProvider {
  const value = toOptionalTrimmed(rawValue) ?? "openrouter";
  if (value === "openrouter" || value === "vercel-ai-gateway") {
    return value;
  }
  throw new Error("AI_PROVIDER must be openrouter or vercel-ai-gateway");
}

export const AI_PROVIDER = resolveAiProvider();
export const GEN_AI_PROVIDER_NAME = AI_PROVIDER;
export const GEN_AI_SERVER_ADDRESS =
  AI_PROVIDER === "openrouter" ? "openrouter.ai" : "ai-gateway.vercel.sh";
export const GEN_AI_SERVER_PORT = 443;
const GEN_AI_OPERATION_CHAT = "chat" as const;
const GEN_AI_OPERATION_EMBEDDINGS = "embeddings" as const;
export const MISSING_AI_PROVIDER_CREDENTIALS_ERROR =
  AI_PROVIDER === "openrouter"
    ? "Missing OpenRouter credentials (OPENROUTER_API_KEY)"
    : "Missing AI Gateway credentials (AI_GATEWAY_API_KEY or VERCEL_OIDC_TOKEN)";

/**
 * Resolve the selected AI provider credential for paths that need the bearer
 * token string directly.
 */
export function getAiProviderApiKey(): string | undefined {
  if (AI_PROVIDER === "openrouter") {
    return toOptionalTrimmed(getEnvApiKey("openrouter"));
  }
  return (
    toOptionalTrimmed(getEnvApiKey("vercel-ai-gateway")) ??
    toOptionalTrimmed(process.env.VERCEL_OIDC_TOKEN)
  );
}

/** Return the selected provider credential expected by Pi Agent hooks. */
export function getPiApiKey(): string | undefined {
  return getAiProviderApiKey();
}

function extractText(message: {
  content?: Array<{ type: string; text?: string }>;
}): string {
  return (message.content ?? [])
    .filter((part) => part.type === "text" && typeof part.text === "string")
    .map((part) => part.text ?? "")
    .join("")
    .trim();
}

/**
 * Look up a model for the selected provider so configuration fails at startup
 * instead of during a turn.
 */
export function resolveAiModel(
  modelId: string,
  provider: AiProvider = AI_PROVIDER,
): Model<any> {
  const matched = getModels(provider).find(
    (model: Model<any>) => model.id === modelId,
  );
  if (!matched) {
    throw new Error(`Unknown ${provider} model id: ${modelId}`);
  }
  return matched;
}

function createAiSdkChatModel(modelId: string, apiKey: string | undefined) {
  if (AI_PROVIDER === "openrouter") {
    return createOpenRouter(apiKey ? { apiKey } : {}).chat(modelId);
  }
  return createGatewayProvider(apiKey ? { apiKey } : {}).chat(modelId);
}

function createAiSdkEmbeddingModel(
  modelId: string,
  apiKey: string | undefined,
) {
  if (AI_PROVIDER === "openrouter") {
    return createOpenRouter(apiKey ? { apiKey } : {}).textEmbeddingModel(
      modelId,
    );
  }
  return createGatewayProvider(apiKey ? { apiKey } : {}).embeddingModel(
    modelId,
  );
}

/** Execute a direct chat completion inside a dedicated `gen_ai.chat` span. */
export async function completeText(params: {
  modelId: string;
  system?: string;
  messages: Message[];
  messageAttributeMode?: "content" | "metadata";
  thinkingLevel?: ThinkingLevel;
  temperature?: number;
  maxTokens?: number;
  signal?: AbortSignal;
  metadata?: Record<string, unknown>;
}) {
  const model = resolveAiModel(params.modelId);
  const apiKey = getPiApiKey();
  const authMode =
    AI_PROVIDER === "vercel-ai-gateway" &&
    !toOptionalTrimmed(process.env.AI_GATEWAY_API_KEY) &&
    toOptionalTrimmed(process.env.VERCEL_OIDC_TOKEN)
      ? "oidc"
      : "api_key";
  // Identifier metadata can only narrow toward private; the turn-scoped
  // privacy context carries the source-confirmed classification.
  const privacy =
    resolveConversationPrivacy({
      channelId:
        typeof params.metadata?.channelId === "string"
          ? params.metadata.channelId
          : undefined,
      conversationId:
        typeof params.metadata?.conversationId === "string"
          ? params.metadata.conversationId
          : typeof params.metadata?.threadId === "string"
            ? params.metadata.threadId
            : undefined,
    }) ?? getCurrentConversationPrivacy();
  const effectivePrivacy = privacy ?? "private";
  const messageAttributeMode =
    params.messageAttributeMode ??
    (effectivePrivacy === "public" ? "content" : "metadata");
  const requestMessagesAttribute = serializeGenAiAttribute(
    messageAttributeMode === "metadata"
      ? params.messages.map(toGenAiMessageMetadata)
      : params.messages.map(toCanonicalInputMessage),
  );
  const systemInstructionsAttribute = params.system
    ? serializeGenAiAttribute(
        messageAttributeMode === "metadata"
          ? [toGenAiTextMetadata(params.system)]
          : [{ type: "text", content: params.system }],
      )
    : undefined;
  const baseAttributes = {
    "gen_ai.provider.name": GEN_AI_PROVIDER_NAME,
    "gen_ai.operation.name": GEN_AI_OPERATION_CHAT,
    "gen_ai.request.model": params.modelId,
    "gen_ai.output.type": "text",
    "server.address": GEN_AI_SERVER_ADDRESS,
    "server.port": GEN_AI_SERVER_PORT,
    "app.conversation.privacy": effectivePrivacy,
    ...(params.thinkingLevel
      ? { "gen_ai.request.reasoning.level": params.thinkingLevel }
      : {}),
  };
  const startAttributes = {
    ...baseAttributes,
    ...toGenAiMessagesTraceAttributes("app.ai.input", params.messages),
    ...(params.system
      ? { "app.ai.system_instructions.content_chars": params.system.length }
      : {}),
    ...(systemInstructionsAttribute
      ? { "gen_ai.system_instructions": systemInstructionsAttribute }
      : {}),
    ...(requestMessagesAttribute
      ? { "gen_ai.input.messages": requestMessagesAttribute }
      : {}),
    "app.ai.auth_mode": authMode,
  };
  return withSpan(
    `${GEN_AI_OPERATION_CHAT} ${params.modelId}`,
    "gen_ai.chat",
    logContextFromMetadata(params.modelId, params.metadata),
    async () => {
      let message: Awaited<ReturnType<typeof completeSimple>>;
      try {
        message = await completeSimple(
          model,
          {
            systemPrompt: params.system,
            messages: params.messages,
          },
          {
            ...(apiKey ? { apiKey } : {}),
            temperature: params.temperature,
            maxTokens: params.maxTokens,
            reasoning: params.thinkingLevel,
            signal: params.signal,
            metadata: params.metadata,
          },
        );
      } catch (error) {
        throw createProviderError(error);
      }
      const outputText = extractText(message);
      const outputMessagesAttribute = serializeGenAiAttribute(
        messageAttributeMode === "metadata"
          ? [
              {
                role: "assistant",
                content: outputText ? [toGenAiTextMetadata(outputText)] : [],
              },
            ]
          : [toCanonicalOutputMessage(message)],
      );
      const usageAttributes = extractGenAiUsageAttributes(message);
      const endAttributes = {
        ...baseAttributes,
        ...toGenAiMessagesTraceAttributes("app.ai.output", [
          {
            role: "assistant",
            content: outputText ? [{ type: "text", text: outputText }] : [],
          },
        ]),
        ...(outputMessagesAttribute
          ? { "gen_ai.output.messages": outputMessagesAttribute }
          : {}),
        ...usageAttributes,
        ...(message.stopReason
          ? { "gen_ai.response.finish_reasons": [message.stopReason] }
          : {}),
      };
      setSpanAttributes(endAttributes);
      if (message.stopReason === "error") {
        const providerMessage =
          message.errorMessage?.trim() || "Unknown provider error";
        logWarn(
          "ai_completion_provider_error",
          {},
          {
            ...baseAttributes,
            "exception.message": providerMessage,
          },
          "AI completion returned provider error",
        );
        throw createProviderError(providerMessage);
      }

      return {
        message,
        text: outputText,
      };
    },
    startAttributes,
  );
}

function logContextFromMetadata(
  modelId: string,
  metadata: Record<string, unknown> | undefined,
): LogContext {
  const conversationId =
    typeof metadata?.conversationId === "string"
      ? metadata.conversationId
      : typeof metadata?.threadId === "string"
        ? metadata.threadId
        : undefined;
  const slackThreadId =
    typeof metadata?.threadId === "string" ? metadata.threadId : undefined;
  const slackChannelId =
    typeof metadata?.channelId === "string" ? metadata.channelId : undefined;
  const runId =
    typeof metadata?.runId === "string" ? metadata.runId : undefined;

  return {
    modelId,
    ...(conversationId ? { conversationId } : {}),
    ...(slackThreadId ? { slackThreadId } : {}),
    ...(slackChannelId ? { slackChannelId } : {}),
    ...(runId ? { runId } : {}),
  };
}

/** Execute a schema-constrained completion using the AI SDK structured output path. */
export async function completeObject<TSchema extends ZodTypeAny>(params: {
  modelId: string;
  schema: TSchema;
  system?: string;
  prompt: string;
  thinkingLevel?: ThinkingLevel;
  temperature?: number;
  maxTokens?: number;
  signal?: AbortSignal;
  metadata?: Record<string, unknown>;
}): Promise<{ object: z.infer<TSchema> }> {
  const apiKey = getAiProviderApiKey();
  try {
    const result = await withSpan(
      `${GEN_AI_OPERATION_CHAT} ${params.modelId}`,
      "gen_ai.chat",
      logContextFromMetadata(params.modelId, params.metadata),
      async () =>
        await generateObject({
          model: createAiSdkChatModel(params.modelId, apiKey),
          schema: params.schema,
          prompt: params.prompt,
          ...(params.system !== undefined ? { system: params.system } : {}),
          ...(params.temperature !== undefined
            ? { temperature: params.temperature }
            : {}),
          ...(params.maxTokens !== undefined
            ? { maxOutputTokens: params.maxTokens }
            : {}),
          ...(params.signal !== undefined
            ? { abortSignal: params.signal }
            : {}),
        }),
      {
        "gen_ai.provider.name": GEN_AI_PROVIDER_NAME,
        "gen_ai.operation.name": GEN_AI_OPERATION_CHAT,
        "gen_ai.request.model": params.modelId,
        "gen_ai.output.type": "json",
        "server.address": GEN_AI_SERVER_ADDRESS,
        "server.port": GEN_AI_SERVER_PORT,
        ...(params.thinkingLevel
          ? { "gen_ai.request.reasoning.level": params.thinkingLevel }
          : {}),
      },
    );
    setSpanAttributes({
      "gen_ai.provider.name": GEN_AI_PROVIDER_NAME,
      "gen_ai.operation.name": GEN_AI_OPERATION_CHAT,
      "gen_ai.request.model": params.modelId,
      "gen_ai.output.type": "json",
      "server.address": GEN_AI_SERVER_ADDRESS,
      "server.port": GEN_AI_SERVER_PORT,
      "gen_ai.response.finish_reasons": [result.finishReason],
      ...extractGenAiUsageAttributes(result.usage),
    });
    return { object: result.object as z.infer<TSchema> };
  } catch (error) {
    const providerError = createProviderError(error);
    if (isProviderRetryError(providerError)) {
      throw providerError;
    }

    logException(
      providerError,
      "ai_completion_failed",
      {},
      {
        "gen_ai.provider.name": GEN_AI_PROVIDER_NAME,
        "gen_ai.operation.name": GEN_AI_OPERATION_CHAT,
        "gen_ai.request.model": params.modelId,
      },
      "AI object completion failed",
    );
    throw providerError;
  }
}

/** Generate text embeddings through the selected host-owned AI provider. */
export async function embedTexts(params: {
  modelId: string;
  texts: string[];
  signal?: AbortSignal;
  metadata?: Record<string, unknown>;
}): Promise<{
  dimensions: number;
  model: string;
  provider: string;
  vectors: number[][];
}> {
  const texts = params.texts.map((text) => text.trim());
  if (texts.length === 0 || texts.some((text) => text.length === 0)) {
    throw new Error("Embedding text is required.");
  }
  const apiKey = getAiProviderApiKey();
  try {
    const result = await withSpan(
      `${GEN_AI_OPERATION_EMBEDDINGS} ${params.modelId}`,
      "gen_ai.embeddings",
      logContextFromMetadata(params.modelId, params.metadata),
      async () =>
        await embedMany({
          model: createAiSdkEmbeddingModel(params.modelId, apiKey),
          values: texts,
          ...(params.signal !== undefined
            ? { abortSignal: params.signal }
            : {}),
        }),
      {
        "gen_ai.provider.name": GEN_AI_PROVIDER_NAME,
        "gen_ai.operation.name": GEN_AI_OPERATION_EMBEDDINGS,
        "gen_ai.request.model": params.modelId,
        "gen_ai.output.type": "embedding",
        "server.address": GEN_AI_SERVER_ADDRESS,
        "server.port": GEN_AI_SERVER_PORT,
      },
    );
    const dimensions = result.embeddings[0]?.length;
    if (
      result.embeddings.length !== texts.length ||
      !dimensions ||
      !result.embeddings.every((embedding) => embedding.length === dimensions)
    ) {
      throw new Error("Embedding provider returned invalid vectors.");
    }
    setSpanAttributes({
      "gen_ai.provider.name": GEN_AI_PROVIDER_NAME,
      "gen_ai.operation.name": GEN_AI_OPERATION_EMBEDDINGS,
      "gen_ai.request.model": params.modelId,
      "gen_ai.output.type": "embedding",
      "server.address": GEN_AI_SERVER_ADDRESS,
      "server.port": GEN_AI_SERVER_PORT,
      ...extractGenAiUsageAttributes(result.usage),
    });
    return {
      dimensions,
      model: params.modelId,
      provider: GEN_AI_PROVIDER_NAME,
      vectors: result.embeddings,
    };
  } catch (error) {
    const providerError = createProviderError(error);
    if (isProviderRetryError(providerError)) {
      throw providerError;
    }

    logException(
      providerError,
      "ai_embeddings_failed",
      {},
      {
        "gen_ai.provider.name": GEN_AI_PROVIDER_NAME,
        "gen_ai.operation.name": GEN_AI_OPERATION_EMBEDDINGS,
        "gen_ai.request.model": params.modelId,
      },
      "AI embeddings failed",
    );
    throw providerError;
  }
}
