import { z } from "zod";
import { juniorToolResultSchema } from "@/chat/tool-support/structured-result";
import { zodTool } from "@/chat/tool-support/zod-tool";
import { createGatewayProvider } from "@ai-sdk/gateway";
import { getModel } from "@earendil-works/pi-ai";
import { generateText } from "ai";
import { withTimeout } from "@/chat/tools/web/network";
import { logException } from "@/chat/logging";
import { toOptionalTrimmed } from "@/chat/optional-string";
import type { WebSearchToolDeps } from "@/chat/tools/types";
import {
  AI_PROVIDER,
  getAiProviderApiKey,
  MISSING_AI_PROVIDER_CREDENTIALS_ERROR,
} from "@/chat/pi/client";

const SEARCH_TIMEOUT_MS = 60_000;
const MAX_RESULTS = 5;
const DEFAULT_SEARCH_MODEL =
  AI_PROVIDER === "openrouter"
    ? getModel("openrouter", "openai/gpt-5.4").id
    : getModel("vercel-ai-gateway", "openai/gpt-5.4").id;
const OPENROUTER_CHAT_COMPLETIONS_URL =
  "https://openrouter.ai/api/v1/chat/completions";
const GATEWAY_SEARCH_TOOL_NAME = "parallelSearch";

interface SearchResult {
  title: string;
  url: string;
  snippet: string;
}

const openRouterSearchResponseSchema = z.object({
  choices: z
    .array(
      z.object({
        message: z
          .object({
            annotations: z
              .array(
                z.object({
                  type: z.string(),
                  url_citation: z
                    .object({
                      content: z.string().trim().optional(),
                      title: z.string().trim().min(1).optional(),
                      url: z.string().trim().min(1),
                    })
                    .optional(),
                }),
              )
              .optional(),
          })
          .optional(),
      }),
    )
    .optional(),
});

const providerErrorResponseSchema = z.object({
  error: z
    .object({
      message: z.string().trim().min(1),
    })
    .optional(),
});

function parseOpenRouterSearchResults(
  payload: z.output<typeof openRouterSearchResponseSchema>,
  maxResults: number,
): SearchResult[] {
  const annotations = payload.choices?.[0]?.message?.annotations ?? [];
  const parsedResults: SearchResult[] = [];

  for (const annotation of annotations) {
    if (annotation.type !== "url_citation" || !annotation.url_citation) {
      continue;
    }
    const citation = annotation.url_citation;

    parsedResults.push({
      title: citation.title ?? citation.url,
      url: citation.url,
      snippet: citation.content ?? "",
    });

    if (parsedResults.length >= maxResults) {
      return parsedResults;
    }
  }

  return parsedResults;
}

function formatSearchResponseError(status: number, body: string): string {
  if (!body) return `OpenRouter web search failed: ${status}`;

  try {
    const parsed = providerErrorResponseSchema.safeParse(JSON.parse(body));
    const message = parsed.success ? parsed.data.error?.message : undefined;
    return message
      ? `OpenRouter web search failed: ${status} ${message}`
      : `OpenRouter web search failed: ${status} ${body}`;
  } catch {
    return `OpenRouter web search failed: ${status} ${body}`;
  }
}

function formatSearchFailure(error: unknown): string {
  const message = error instanceof Error ? error.message.trim() : "";
  return message ? `web search failed: ${message}` : "web search failed";
}

function isAuthFailure(message: string): boolean {
  const normalized = message.toLowerCase();
  return (
    normalized.includes("missing ai gateway credentials") ||
    normalized.includes("missing openrouter credentials") ||
    normalized.includes("authentication failed")
  );
}

interface ProviderSearchParams {
  controller: AbortController;
  maxResults: number;
  model: string;
  query: string;
}

async function searchOpenRouter({
  controller,
  maxResults,
  model,
  query,
}: ProviderSearchParams) {
  const apiKey = getAiProviderApiKey();
  if (!apiKey) {
    throw new Error(MISSING_AI_PROVIDER_CREDENTIALS_ERROR);
  }
  const response = await withTimeout(
    fetch(OPENROUTER_CHAT_COMPLETIONS_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: query }],
        plugins: [{ id: "web", engine: "parallel", max_results: maxResults }],
      }),
      signal: controller.signal,
    }),
    SEARCH_TIMEOUT_MS,
    "webSearch",
    { onTimeout: () => controller.abort() },
  );
  if (!response.ok) {
    throw new Error(
      formatSearchResponseError(response.status, await response.text()),
    );
  }
  const payload = openRouterSearchResponseSchema.parse(await response.json());
  return parseOpenRouterSearchResults(payload, maxResults);
}

async function searchGateway({
  controller,
  maxResults,
  model,
  query,
}: ProviderSearchParams) {
  const provider = createGatewayProvider();
  const parallelSearch = provider.tools.parallelSearch({
    mode: "agentic",
    maxResults,
  });
  const response = await withTimeout(
    generateText({
      model: provider.chat(model),
      prompt: query,
      tools: {
        [GATEWAY_SEARCH_TOOL_NAME]: parallelSearch,
      },
      toolChoice: {
        type: "tool",
        toolName: GATEWAY_SEARCH_TOOL_NAME,
      },
      abortSignal: controller.signal,
    }),
    SEARCH_TIMEOUT_MS,
    "webSearch",
    { onTimeout: () => controller.abort() },
  );

  for (const toolResult of response.toolResults) {
    if (
      toolResult.dynamic === true ||
      toolResult.toolName !== GATEWAY_SEARCH_TOOL_NAME
    ) {
      continue;
    }

    if ("error" in toolResult.output) {
      throw new Error(
        `AI Gateway web search failed: ${toolResult.output.message}`,
      );
    }

    return toolResult.output.results.slice(0, maxResults).map((result) => ({
      title: result.title,
      url: result.url,
      snippet: result.excerpt,
    }));
  }

  return [];
}

export function createWebSearchTool(override?: WebSearchToolDeps) {
  return zodTool({
    description:
      "Search public web sources and return top snippets/URLs. Use when you need discovery or source candidates. Do not use when the user already provided a specific URL to inspect.",
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      openWorldHint: true,
    },
    inputSchema: z.object({
      query: z.string().min(1).max(500).describe("Search query."),
      max_results: z.coerce
        .number()
        .int()
        .min(1)
        .max(MAX_RESULTS)
        .describe("Max results to return.")
        .optional(),
    }),
    outputSchema: juniorToolResultSchema,
    execute: async ({ query, max_results }) => {
      if (override?.execute) {
        return override.execute({ query, max_results });
      }

      const maxResults = max_results ?? 3;
      // Keep web search pinned to a provider-tool capable model instead of
      // inheriting the main turn model.
      const model =
        toOptionalTrimmed(process.env.AI_WEB_SEARCH_MODEL) ??
        DEFAULT_SEARCH_MODEL;
      const controller = new AbortController();

      try {
        const results =
          AI_PROVIDER === "openrouter"
            ? await searchOpenRouter({
                controller,
                maxResults,
                model,
                query,
              })
            : await searchGateway({
                controller,
                maxResults,
                model,
                query,
              });
        return {
          ok: true,
          status: "success" as const,
          model,
          query,
          result_count: results.length,
          results,
        };
      } catch (error) {
        const message = formatSearchFailure(error);
        const timeout = /timed out/i.test(message);
        const retryable = !isAuthFailure(message);
        // Every ok:false path surfaces to Sentry. The tool swallows the
        // exception for the model, so without an explicit capture the
        // failure is otherwise invisible to us.
        logException(
          error,
          "web_search_failed",
          {},
          {
            "gen_ai.tool.name": "webSearch",
            "app.web_search.timeout": timeout,
            "app.web_search.retryable": retryable,
            "app.web_search.query": query,
          },
          message,
        );
        return {
          ok: false,
          status: "error" as const,
          query,
          result_count: 0,
          results: [],
          error: message,
          timeout,
          retryable,
        };
      }
    },
  });
}
