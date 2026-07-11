import { afterEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";

const ORIGINAL_AI_PROVIDER = process.env.AI_PROVIDER;

const mocks = vi.hoisted(() => ({
  completeSimple: vi.fn(),
  createGatewayProvider: vi.fn(() => ({
    chat: vi.fn((modelId: string) => ({ modelId })),
    embeddingModel: vi.fn((modelId: string) => ({ modelId })),
  })),
  createOpenRouter: vi.fn(() => ({
    chat: vi.fn((modelId: string) => ({ modelId })),
    textEmbeddingModel: vi.fn((modelId: string) => ({ modelId })),
  })),
  generateObject: vi.fn(),
  getEnvApiKey: vi.fn(),
  getModels: vi.fn(() => [{ id: "openai/gpt-4o-mini" }]),
  logException: vi.fn(),
  logWarn: vi.fn(),
  registerApiProvider: vi.fn(),
  setSpanAttributes: vi.fn(),
  streamAnthropic: vi.fn(),
  streamOpenAICompletions: vi.fn(),
  streamSimpleAnthropic: vi.fn(),
  streamSimpleOpenAICompletions: vi.fn(),
  withSpan: vi.fn(
    async (
      _name: string,
      _op: string,
      _context: Record<string, unknown>,
      callback: () => Promise<unknown>,
      _attributes?: Record<string, unknown>,
    ) => callback(),
  ),
}));

vi.mock("@earendil-works/pi-ai", () => ({
  completeSimple: mocks.completeSimple,
  getEnvApiKey: mocks.getEnvApiKey,
  getModels: mocks.getModels,
  registerApiProvider: mocks.registerApiProvider,
}));

vi.mock("@earendil-works/pi-ai/anthropic", () => ({
  streamAnthropic: mocks.streamAnthropic,
  streamSimpleAnthropic: mocks.streamSimpleAnthropic,
}));

vi.mock("@earendil-works/pi-ai/openai-completions", () => ({
  streamOpenAICompletions: mocks.streamOpenAICompletions,
  streamSimpleOpenAICompletions: mocks.streamSimpleOpenAICompletions,
}));

vi.mock("@openrouter/ai-sdk-provider", () => ({
  createOpenRouter: mocks.createOpenRouter,
}));

vi.mock("@ai-sdk/gateway", () => ({
  createGatewayProvider: mocks.createGatewayProvider,
}));

vi.mock("ai", () => ({
  generateObject: mocks.generateObject,
}));

vi.mock("@/chat/logging", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/chat/logging")>()),
  logException: mocks.logException,
  logWarn: mocks.logWarn,
  setSpanAttributes: mocks.setSpanAttributes,
  withSpan: mocks.withSpan,
}));

describe("completeText", () => {
  afterEach(() => {
    if (ORIGINAL_AI_PROVIDER === undefined) {
      delete process.env.AI_PROVIDER;
    } else {
      process.env.AI_PROVIDER = ORIGINAL_AI_PROVIDER;
    }
    vi.clearAllMocks();
    vi.resetModules();
  });

  it("creates a gen_ai.chat span for provider completions", async () => {
    mocks.completeSimple.mockResolvedValue({
      content: [{ type: "text", text: "hello world" }],
      stopReason: "stop",
      usage: {
        input: 12,
        output: 4,
        totalTokens: 16,
      },
    });

    const { completeText, GEN_AI_PROVIDER_NAME } =
      await import("@/chat/pi/client");

    const result = await completeText({
      modelId: "openai/gpt-4o-mini",
      system: "Be concise.",
      messages: [{ role: "user", content: "hi", timestamp: 1 }] as any,
      thinkingLevel: "low",
    });

    expect(result.text).toBe("hello world");
    expect(mocks.withSpan).toHaveBeenCalledTimes(1);

    const [name, op, context, _callback, attributes] = mocks.withSpan.mock
      .calls[0] as [
      string,
      string,
      Record<string, unknown>,
      () => Promise<unknown>,
      Record<string, unknown>,
    ];

    expect(name).toBe("chat openai/gpt-4o-mini");
    expect(op).toBe("gen_ai.chat");
    expect(context).toEqual({ modelId: "openai/gpt-4o-mini" });
    expect(attributes).toEqual(
      expect.objectContaining({
        "gen_ai.provider.name": GEN_AI_PROVIDER_NAME,
        "gen_ai.operation.name": "chat",
        "gen_ai.request.model": "openai/gpt-4o-mini",
        "gen_ai.output.type": "text",
        "server.address": "openrouter.ai",
        "server.port": 443,
        "gen_ai.request.reasoning.level": "low",
      }),
    );
    expect(attributes["gen_ai.system_instructions"]).toBeDefined();
    expect(attributes["gen_ai.input.messages"]).toBeDefined();

    expect(mocks.setSpanAttributes).toHaveBeenCalledWith(
      expect.objectContaining({
        "gen_ai.provider.name": GEN_AI_PROVIDER_NAME,
        "gen_ai.operation.name": "chat",
        "gen_ai.request.model": "openai/gpt-4o-mini",
        "gen_ai.output.type": "text",
        "server.address": "openrouter.ai",
        "server.port": 443,
        "gen_ai.output.messages": expect.any(String),
        "gen_ai.response.finish_reasons": ["stop"],
      }),
    );
  });

  it("uses message metadata for non-public conversation traces", async () => {
    mocks.completeSimple.mockResolvedValue({
      content: [{ type: "text", text: "private answer" }],
      stopReason: "stop",
      usage: { input: 12, output: 4, totalTokens: 16 },
    });

    const { completeText } = await import("@/chat/pi/client");

    await completeText({
      modelId: "openai/gpt-4o-mini",
      system: "private system",
      messages: [
        { role: "user", content: "private question", timestamp: 1 },
      ] as any,
      metadata: {
        conversationId: "slack:D1:123",
        channelId: "D1",
      },
    });

    const attributes = mocks.withSpan.mock.calls[0]?.[4] as Record<
      string,
      unknown
    >;
    const context = mocks.withSpan.mock.calls[0]?.[2] as Record<
      string,
      unknown
    >;
    expect(context).toMatchObject({
      conversationId: "slack:D1:123",
      slackChannelId: "D1",
      modelId: "openai/gpt-4o-mini",
    });
    expect(attributes["app.conversation.privacy"]).toBe("private");
    expect(attributes["server.address"]).toBe("openrouter.ai");
    expect(attributes["server.port"]).toBe(443);
    expect(attributes["gen_ai.output.type"]).toBe("text");
    expect(attributes["app.ai.input.message_count"]).toBe(1);
    expect(attributes["app.ai.input.content_chars"]).toBe(16);
    expect(attributes["gen_ai.system_instructions"]).toContain('"chars"');
    expect(attributes["gen_ai.system_instructions"]).not.toContain(
      "private system",
    );
    expect(attributes["gen_ai.input.messages"]).toContain('"chars"');
    expect(attributes["gen_ai.input.messages"]).not.toContain(
      "private question",
    );

    const endAttributes = mocks.setSpanAttributes.mock.calls[0]?.[0] as Record<
      string,
      unknown
    >;
    expect(endAttributes["app.ai.output.message_count"]).toBe(1);
    expect(endAttributes["app.ai.output.content_chars"]).toBe(14);
    expect(endAttributes["gen_ai.output.messages"]).toContain('"chars"');
    expect(endAttributes["gen_ai.output.messages"]).not.toContain(
      "private answer",
    );
  });

  it("scrubs C-prefixed channel traces unless the turn confirmed the channel public", async () => {
    mocks.completeSimple.mockResolvedValue({
      content: [{ type: "text", text: "maybe private answer" }],
      stopReason: "stop",
      usage: { input: 12, output: 4, totalTokens: 16 },
    });

    const { completeText } = await import("@/chat/pi/client");
    const { runWithConversationPrivacy } =
      await import("@/chat/conversation-privacy");

    // Modern Slack private channels also use C ids: without a confirmed
    // signal the capture stays metadata-only.
    await completeText({
      modelId: "openai/gpt-4o-mini",
      messages: [
        { role: "user", content: "possibly private question", timestamp: 1 },
      ] as any,
      metadata: { conversationId: "slack:C1:123", channelId: "C1" },
    });
    const noSignal = mocks.withSpan.mock.calls[0]?.[4] as Record<
      string,
      unknown
    >;
    expect(noSignal["app.conversation.privacy"]).toBe("private");
    expect(noSignal["gen_ai.input.messages"]).not.toContain(
      "possibly private question",
    );

    // The turn-scoped privacy context carries the source-confirmed signal.
    await runWithConversationPrivacy("public", () =>
      completeText({
        modelId: "openai/gpt-4o-mini",
        messages: [
          { role: "user", content: "public question", timestamp: 1 },
        ] as any,
        metadata: { conversationId: "slack:C1:123", channelId: "C1" },
      }),
    );
    const publicSignal = mocks.withSpan.mock.calls[1]?.[4] as Record<
      string,
      unknown
    >;
    expect(publicSignal["app.conversation.privacy"]).toBe("public");
    expect(publicSignal["gen_ai.input.messages"]).toContain("public question");
  });

  it("uses AI SDK structured output for object completions", async () => {
    mocks.generateObject.mockResolvedValue({
      object: { ok: true },
      finishReason: "stop",
      usage: { inputTokens: 10, outputTokens: 3, totalTokens: 13 },
    });

    const { completeObject, GEN_AI_PROVIDER_NAME } =
      await import("@/chat/pi/client");
    const schema = z.object({ ok: z.boolean() });

    const result = await completeObject({
      modelId: "openai/gpt-4o-mini",
      schema,
      prompt: "return json",
      system: "structured only",
    });

    expect(result).toEqual({ object: { ok: true } });
    expect(mocks.generateObject).toHaveBeenCalledWith(
      expect.objectContaining({
        model: { modelId: "openai/gpt-4o-mini" },
        schema,
        prompt: "return json",
        system: "structured only",
      }),
    );
    expect(mocks.setSpanAttributes).toHaveBeenCalledWith(
      expect.objectContaining({
        "gen_ai.provider.name": GEN_AI_PROVIDER_NAME,
        "gen_ai.operation.name": "chat",
        "gen_ai.request.model": "openai/gpt-4o-mini",
        "gen_ai.output.type": "json",
        "gen_ai.response.finish_reasons": ["stop"],
      }),
    );
  });

  it("uses the Gateway provider for structured output when selected", async () => {
    process.env.AI_PROVIDER = "vercel-ai-gateway";
    mocks.generateObject.mockResolvedValue({
      object: { ok: true },
      finishReason: "stop",
      usage: { inputTokens: 10, outputTokens: 3, totalTokens: 13 },
    });
    vi.resetModules();

    const { completeObject, GEN_AI_PROVIDER_NAME, GEN_AI_SERVER_ADDRESS } =
      await import("@/chat/pi/client");
    await completeObject({
      modelId: "openai/gpt-4o-mini",
      schema: z.object({ ok: z.boolean() }),
      prompt: "return json",
    });

    expect(GEN_AI_PROVIDER_NAME).toBe("vercel-ai-gateway");
    expect(GEN_AI_SERVER_ADDRESS).toBe("ai-gateway.vercel.sh");
    expect(mocks.createGatewayProvider).toHaveBeenCalledTimes(1);
    expect(mocks.createOpenRouter).not.toHaveBeenCalled();
  });

  it("rethrows retryable object provider failures without capturing", async () => {
    mocks.generateObject.mockRejectedValue(
      new Error("Anthropic stream ended before message_stop"),
    );

    const { completeObject } = await import("@/chat/pi/client");

    await expect(
      completeObject({
        modelId: "openai/gpt-4o-mini",
        schema: z.object({ ok: z.boolean() }),
        prompt: "return json",
      }),
    ).rejects.toThrow(
      "AI provider error: Anthropic stream ended before message_stop",
    );
    expect(mocks.logWarn).not.toHaveBeenCalled();
    expect(mocks.logException).not.toHaveBeenCalled();
  });
});
