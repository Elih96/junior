import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { GatewayProvider } from "@ai-sdk/gateway";
import type { InferToolOutput } from "ai";
import { createWebSearchTool } from "@/chat/tools/web/search";
import type { ToolExecuteOptions } from "@/chat/tools/definition";

type ParallelSearchOutput = InferToolOutput<
  ReturnType<GatewayProvider["tools"]["parallelSearch"]>
>;

interface GatewayProviderMock {
  chat(model: string): { model: string };
  tools: {
    parallelSearch(options: { maxResults: number; mode: "agentic" }): {
      id: string;
    };
  };
}

interface GatewayGenerateTextResultMock {
  toolResults: Array<{
    dynamic: false;
    output: ParallelSearchOutput;
    toolName: "parallelSearch";
    type: "tool-result";
  }>;
}

const TOOL_EXECUTE_OPTIONS: ToolExecuteOptions = {};

const providerMocks = vi.hoisted(() => ({
  createGatewayProvider: vi.fn<() => GatewayProviderMock>(),
  generateText:
    vi.fn<(options: object) => Promise<GatewayGenerateTextResultMock>>(),
}));

vi.mock("ai", () => ({
  generateText: providerMocks.generateText,
}));

vi.mock("@ai-sdk/gateway", () => ({
  createGatewayProvider: providerMocks.createGatewayProvider,
}));

function createJsonResponse(payload: unknown) {
  return {
    ok: true,
    status: 200,
    json: async () => payload,
  } as Response;
}

function createErrorResponse(status: number, body: string) {
  return {
    ok: false,
    status,
    text: async () => body,
  } as Response;
}

function openRouterSearchPayload() {
  return {
    choices: [
      {
        message: {
          annotations: [
            {
              type: "url_citation",
              url_citation: {
                title: "OpenRouter Web Search",
                url: "https://openrouter.ai/docs/features/web-search",
                content: "Web search docs",
              },
            },
          ],
        },
      },
    ],
  };
}

describe("createWebSearchTool", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    process.env.OPENROUTER_API_KEY = "test-key";
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    delete process.env.AI_PROVIDER;
    delete process.env.AI_GATEWAY_API_KEY;
    delete process.env.OPENROUTER_API_KEY;
    delete process.env.VERCEL_OIDC_TOKEN;
    delete process.env.AI_WEB_SEARCH_MODEL;
    delete process.env.AI_FAST_MODEL;
    delete process.env.AI_MODEL;
    vi.unstubAllGlobals();
    vi.useRealTimers();
    vi.clearAllMocks();
    vi.resetModules();
  });

  it("uses OpenRouter web search and maps URL citations", async () => {
    process.env.AI_WEB_SEARCH_MODEL = "openai/gpt-5.4";
    fetchMock.mockResolvedValueOnce(
      createJsonResponse(openRouterSearchPayload()),
    );

    const tool = createWebSearchTool();
    if (typeof tool.execute !== "function") {
      throw new Error("webSearch execute function missing");
    }

    const result = await tool.execute(
      { query: "openrouter web search", max_results: 2 },
      TOOL_EXECUTE_OPTIONS,
    );

    expect(fetchMock).toHaveBeenCalledWith(
      "https://openrouter.ai/api/v1/chat/completions",
      expect.objectContaining({
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: "Bearer test-key",
        },
        signal: expect.any(AbortSignal),
      }),
    );
    const request = fetchMock.mock.calls[0]?.[1] as RequestInit;
    const body = JSON.parse(request.body as string);
    expect(body).toEqual({
      model: "openai/gpt-5.4",
      messages: [{ role: "user", content: "openrouter web search" }],
      plugins: [{ id: "web", engine: "parallel", max_results: 2 }],
    });
    expect(result).toEqual({
      ok: true,
      status: "success",
      model: "openai/gpt-5.4",
      query: "openrouter web search",
      result_count: 1,
      results: [
        {
          title: "OpenRouter Web Search",
          url: "https://openrouter.ai/docs/features/web-search",
          snippet: "Web search docs",
        },
      ],
    });
  });

  it("uses AI Gateway parallel search when Gateway is selected", async () => {
    process.env.AI_PROVIDER = "vercel-ai-gateway";
    process.env.AI_GATEWAY_API_KEY = "gateway-key";
    const parallelSearch = { id: "parallel-search-tool" };
    const gatewayProvider = {
      chat: vi.fn((model: string) => ({ model })),
      tools: {
        parallelSearch: vi.fn(() => parallelSearch),
      },
    };
    providerMocks.createGatewayProvider.mockReturnValue(gatewayProvider);
    providerMocks.generateText.mockResolvedValueOnce({
      toolResults: [
        {
          dynamic: false,
          type: "tool-result",
          toolName: "parallelSearch",
          output: {
            searchId: "search-1",
            results: [
              {
                title: "Vercel AI Gateway",
                url: "https://vercel.com/docs/ai-gateway",
                excerpt: "Gateway docs",
              },
            ],
          },
        },
      ],
    });
    vi.resetModules();
    const { createWebSearchTool: createGatewaySearchTool } =
      await import("@/chat/tools/web/search");
    const tool = createGatewaySearchTool();
    if (typeof tool.execute !== "function") {
      throw new Error("webSearch execute function missing");
    }

    const result = await tool.execute(
      { query: "vercel ai gateway", max_results: 2 },
      TOOL_EXECUTE_OPTIONS,
    );

    expect(gatewayProvider.tools.parallelSearch).toHaveBeenCalledWith({
      mode: "agentic",
      maxResults: 2,
    });
    expect(providerMocks.generateText).toHaveBeenCalledWith(
      expect.objectContaining({
        model: { model: "openai/gpt-5.4" },
        prompt: "vercel ai gateway",
        toolChoice: { type: "tool", toolName: "parallelSearch" },
      }),
    );
    expect(result).toMatchObject({
      ok: true,
      model: "openai/gpt-5.4",
      result_count: 1,
      results: [
        {
          title: "Vercel AI Gateway",
          url: "https://vercel.com/docs/ai-gateway",
          snippet: "Gateway docs",
        },
      ],
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns Gateway parallel search failures as tool errors", async () => {
    process.env.AI_PROVIDER = "vercel-ai-gateway";
    process.env.AI_GATEWAY_API_KEY = "gateway-key";
    const gatewayProvider = {
      chat: vi.fn((model: string) => ({ model })),
      tools: {
        parallelSearch: vi.fn(() => ({ id: "parallel-search-tool" })),
      },
    };
    providerMocks.createGatewayProvider.mockReturnValue(gatewayProvider);
    providerMocks.generateText.mockResolvedValueOnce({
      toolResults: [
        {
          dynamic: false,
          type: "tool-result",
          toolName: "parallelSearch",
          output: {
            error: "rate_limit",
            statusCode: 429,
            message: "Parallel search rate limit exceeded",
          },
        },
      ],
    });
    vi.resetModules();
    const { createWebSearchTool: createGatewaySearchTool } =
      await import("@/chat/tools/web/search");
    const tool = createGatewaySearchTool();
    if (typeof tool.execute !== "function") {
      throw new Error("webSearch execute function missing");
    }

    await expect(
      tool.execute({ query: "vercel ai gateway" }, TOOL_EXECUTE_OPTIONS),
    ).resolves.toEqual({
      ok: false,
      status: "error",
      query: "vercel ai gateway",
      result_count: 0,
      results: [],
      error:
        "web search failed: AI Gateway web search failed: Parallel search rate limit exceeded",
      timeout: false,
      retryable: true,
    });
  });

  it("uses the default search model when AI_WEB_SEARCH_MODEL is unset, ignoring AI_MODEL/AI_FAST_MODEL", async () => {
    process.env.AI_FAST_MODEL = "openai/gpt-5.4";
    process.env.AI_MODEL = "anthropic/claude-sonnet-4.6";
    fetchMock.mockResolvedValueOnce(
      createJsonResponse({ choices: [{ message: { annotations: [] } }] }),
    );

    const tool = createWebSearchTool();
    if (typeof tool.execute !== "function") {
      throw new Error("webSearch execute function missing");
    }

    await tool.execute({ query: "anything" }, TOOL_EXECUTE_OPTIONS);

    const request = fetchMock.mock.calls[0]?.[1] as RequestInit;
    const body = JSON.parse(request.body as string);
    expect(body.model).toBe("openai/gpt-5.4");
  });

  it("uses the default search model when AI_WEB_SEARCH_MODEL is blank", async () => {
    process.env.AI_WEB_SEARCH_MODEL = "  ";
    fetchMock.mockResolvedValueOnce(
      createJsonResponse({ choices: [{ message: { annotations: [] } }] }),
    );

    const tool = createWebSearchTool();
    if (typeof tool.execute !== "function") {
      throw new Error("webSearch execute function missing");
    }

    await tool.execute({ query: "anything" }, TOOL_EXECUTE_OPTIONS);

    const request = fetchMock.mock.calls[0]?.[1] as RequestInit;
    const body = JSON.parse(request.body as string);
    expect(body.model).toBe("openai/gpt-5.4");
  });

  it("wraps OpenRouter fetch errors in web search error message", async () => {
    fetchMock.mockRejectedValueOnce(
      new Error('400 Invalid input: expected "function"'),
    );

    const tool = createWebSearchTool();
    if (typeof tool.execute !== "function") {
      throw new Error("webSearch execute function missing");
    }

    await expect(
      tool.execute({ query: "test query" }, TOOL_EXECUTE_OPTIONS),
    ).resolves.toEqual({
      ok: false,
      status: "error",
      query: "test query",
      result_count: 0,
      results: [],
      error: 'web search failed: 400 Invalid input: expected "function"',
      timeout: false,
      retryable: true,
    });
  });

  it("returns a retryable timeout error instead of throwing", async () => {
    vi.useFakeTimers();
    fetchMock.mockImplementation(
      () =>
        new Promise(() => {
          // Intentionally unresolved to trigger tool timeout.
        }),
    );

    const tool = createWebSearchTool();
    if (typeof tool.execute !== "function") {
      throw new Error("webSearch execute function missing");
    }

    const pending = tool.execute({ query: "test query" }, TOOL_EXECUTE_OPTIONS);
    await vi.advanceTimersByTimeAsync(60_000);
    await expect(pending).resolves.toEqual({
      ok: false,
      status: "error",
      query: "test query",
      result_count: 0,
      results: [],
      error: "web search failed: webSearch timed out",
      timeout: true,
      retryable: true,
    });
    vi.useRealTimers();
  });

  it("aborts the fetch call on timeout", async () => {
    vi.useFakeTimers();
    let capturedSignal: AbortSignal | undefined;
    fetchMock.mockImplementation((_url: string, opts: RequestInit) => {
      capturedSignal = opts.signal as AbortSignal;
      return new Promise(() => {
        // Intentionally unresolved to trigger tool timeout.
      });
    });

    const tool = createWebSearchTool();
    if (typeof tool.execute !== "function") {
      throw new Error("webSearch execute function missing");
    }

    const pending = tool.execute({ query: "slow query" }, TOOL_EXECUTE_OPTIONS);
    expect(capturedSignal?.aborted).toBe(false);
    await vi.advanceTimersByTimeAsync(60_000);
    await pending;
    expect(capturedSignal?.aborted).toBe(true);
    vi.useRealTimers();
  });

  it("does not abort signal on successful search", async () => {
    let capturedSignal: AbortSignal | undefined;
    fetchMock.mockImplementation((_url: string, opts: RequestInit) => {
      capturedSignal = opts.signal as AbortSignal;
      return Promise.resolve(
        createJsonResponse({ choices: [{ message: { annotations: [] } }] }),
      );
    });

    const tool = createWebSearchTool();
    if (typeof tool.execute !== "function") {
      throw new Error("webSearch execute function missing");
    }

    await tool.execute({ query: "fast query" }, TOOL_EXECUTE_OPTIONS);
    expect(capturedSignal?.aborted).toBe(false);
  });

  it("still reports timeout even if abort signal cleanup throws", async () => {
    vi.useFakeTimers();
    const brokenController = new AbortController();
    const originalAbort = brokenController.abort.bind(brokenController);
    brokenController.abort = () => {
      originalAbort();
      throw new Error("abort listener blew up");
    };

    const originalAC = globalThis.AbortController;
    globalThis.AbortController = class extends originalAC {
      constructor() {
        super();
        return brokenController as unknown as AbortController;
      }
    } as typeof AbortController;

    fetchMock.mockImplementation(
      () =>
        new Promise(() => {
          // Intentionally unresolved to trigger tool timeout.
        }),
    );

    const tool = createWebSearchTool();
    if (typeof tool.execute !== "function") {
      throw new Error("webSearch execute function missing");
    }

    const pending = tool.execute({ query: "boom query" }, TOOL_EXECUTE_OPTIONS);
    await vi.advanceTimersByTimeAsync(60_000);
    const result = await pending;

    globalThis.AbortController = originalAC;

    expect(result).toMatchObject({
      ok: false,
      timeout: true,
      error: "web search failed: webSearch timed out",
    });
    vi.useRealTimers();
  });

  it("marks authentication failures as non-retryable", async () => {
    fetchMock.mockResolvedValueOnce(
      createErrorResponse(
        401,
        JSON.stringify({
          error: { message: "OpenRouter authentication failed." },
        }),
      ),
    );

    const tool = createWebSearchTool();
    if (typeof tool.execute !== "function") {
      throw new Error("webSearch execute function missing");
    }

    await expect(
      tool.execute({ query: "test" }, TOOL_EXECUTE_OPTIONS),
    ).resolves.toEqual({
      ok: false,
      status: "error",
      query: "test",
      result_count: 0,
      results: [],
      error:
        "web search failed: OpenRouter web search failed: 401 OpenRouter authentication failed.",
      timeout: false,
      retryable: false,
    });
  });

  it("marks missing OpenRouter API key as non-retryable", async () => {
    delete process.env.OPENROUTER_API_KEY;

    const tool = createWebSearchTool();
    if (typeof tool.execute !== "function") {
      throw new Error("webSearch execute function missing");
    }

    await expect(
      tool.execute({ query: "test" }, TOOL_EXECUTE_OPTIONS),
    ).resolves.toEqual({
      ok: false,
      status: "error",
      query: "test",
      result_count: 0,
      results: [],
      error:
        "web search failed: Missing OpenRouter credentials (OPENROUTER_API_KEY)",
      timeout: false,
      retryable: false,
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
