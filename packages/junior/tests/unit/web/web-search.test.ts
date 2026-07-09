import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createWebSearchTool } from "@/chat/tools/web/search";

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
    delete process.env.OPENROUTER_API_KEY;
    delete process.env.AI_WEB_SEARCH_MODEL;
    delete process.env.AI_FAST_MODEL;
    delete process.env.AI_MODEL;
    vi.unstubAllGlobals();
    vi.useRealTimers();
    vi.clearAllMocks();
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
      {} as never,
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

    await tool.execute({ query: "anything" }, {} as never);

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
      tool.execute({ query: "test query" }, {} as never),
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

    const pending = tool.execute({ query: "test query" }, {} as never);
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

    const pending = tool.execute({ query: "slow query" }, {} as never);
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

    await tool.execute({ query: "fast query" }, {} as never);
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

    const pending = tool.execute({ query: "boom query" }, {} as never);
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

    await expect(tool.execute({ query: "test" }, {} as never)).resolves.toEqual(
      {
        ok: false,
        status: "error",
        query: "test",
        result_count: 0,
        results: [],
        error:
          "web search failed: OpenRouter web search failed: 401 OpenRouter authentication failed.",
        timeout: false,
        retryable: false,
      },
    );
  });

  it("marks missing OpenRouter API key as non-retryable", async () => {
    delete process.env.OPENROUTER_API_KEY;

    const tool = createWebSearchTool();
    if (typeof tool.execute !== "function") {
      throw new Error("webSearch execute function missing");
    }

    await expect(tool.execute({ query: "test" }, {} as never)).resolves.toEqual(
      {
        ok: false,
        status: "error",
        query: "test",
        result_count: 0,
        results: [],
        error:
          "web search failed: Missing AI gateway credentials (OPENROUTER_API_KEY)",
        timeout: false,
        retryable: false,
      },
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
