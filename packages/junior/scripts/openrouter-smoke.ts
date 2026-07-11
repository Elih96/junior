import { existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  Agent,
  type AgentEvent,
  type AgentTool,
} from "@earendil-works/pi-agent-core";
import { Type } from "@earendil-works/pi-ai";
import { z } from "zod";

const TEXT_MODEL = "deepseek/deepseek-v4-pro";
const FAST_MODEL = "deepseek/deepseek-v4-flash";
const EMBEDDING_MODEL = "openai/text-embedding-3-small";
const SMOKE_DATABASE_URL = "postgres://localhost:5432/openrouter_smoke";
const PACKAGE_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const WORKSPACE_ROOT = resolve(PACKAGE_ROOT, "../..");

function loadLocalEnvFiles() {
  const nodeEnv = process.env.NODE_ENV ?? "development";
  const envFiles = [
    `.env.${nodeEnv}.local`,
    ...(nodeEnv === "test" ? [] : [".env.local"]),
    `.env.${nodeEnv}`,
    ".env",
  ];

  for (const root of [WORKSPACE_ROOT, PACKAGE_ROOT]) {
    for (const envFile of envFiles) {
      const absolutePath = join(root, envFile);
      if (!existsSync(absolutePath)) {
        continue;
      }
      process.loadEnvFile(absolutePath);
    }
  }
}

async function loadJuniorModules() {
  const [client, imageGenerate, webSearch] = await Promise.all([
    import("../src/chat/pi/client"),
    import("../src/chat/tools/web/image-generate"),
    import("../src/chat/tools/web/search"),
  ]);

  return {
    ...client,
    createImageGenerateTool: imageGenerate.createImageGenerateTool,
    createWebSearchTool: webSearch.createWebSearchTool,
  };
}

type JuniorModules = Awaited<ReturnType<typeof loadJuniorModules>>;

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function usageTokens(message: {
  usage?: {
    input?: number;
    output?: number;
    totalTokens?: number;
  };
}) {
  const usage = message.usage;
  return (
    (usage?.totalTokens ?? 0) || (usage?.input ?? 0) + (usage?.output ?? 0)
  );
}

async function smokeCompleteText(junior: JuniorModules) {
  const result = await junior.completeText({
    modelId: TEXT_MODEL,
    system: "Answer in one short sentence.",
    messages: [
      {
        role: "user",
        content: "Say OpenRouter smoke test passed.",
        timestamp: Date.now(),
      },
    ],
    maxTokens: 64,
  });

  assert(result.text.length > 0, "completeText returned empty text");
  assert(
    usageTokens(result.message) > 0,
    "completeText did not report usage tokens",
  );
}

async function smokeReasoning(junior: JuniorModules) {
  const result = await junior.completeText({
    modelId: TEXT_MODEL,
    system: "Answer in one short sentence.",
    messages: [
      {
        role: "user",
        content: "What is 11 + 31?",
        timestamp: Date.now(),
      },
    ],
    thinkingLevel: "medium",
    maxTokens: 64,
  });

  assert(result.text.length > 0, "reasoning completeText returned empty text");
  assert(
    usageTokens(result.message) > 0,
    "reasoning completeText did not report usage tokens",
  );
}

async function smokeAgentToolRoundtrip(junior: JuniorModules) {
  let sawTextDelta = false;
  let sawToolExecution = false;
  const echoParameters = Type.Object({
    value: Type.String(),
  });
  const echoTool: AgentTool<typeof echoParameters> = {
    name: "echo",
    label: "Echo",
    description: "Echo a short value.",
    parameters: echoParameters,
    execute: async (_toolCallId, params) => {
      sawToolExecution = true;
      return {
        content: [{ type: "text", text: `echo:${params.value}` }],
        details: { value: params.value },
      };
    },
  };

  const agent = new Agent({
    ...(junior.getPiApiKey() ? { getApiKey: () => junior.getPiApiKey() } : {}),
    initialState: {
      systemPrompt:
        "Call the echo tool exactly once with value 'openrouter', then summarize the tool result.",
      model: junior.resolveAiModel(FAST_MODEL),
      thinkingLevel: "off",
      tools: [echoTool],
    },
  });
  agent.subscribe((event: AgentEvent) => {
    if (event.type !== "message_update") return;
    if (
      event.assistantMessageEvent.type === "text_delta" &&
      event.assistantMessageEvent.delta.length > 0
    ) {
      sawTextDelta = true;
    }
  });

  await agent.prompt({
    role: "user",
    content: [{ type: "text", text: "Use the echo tool now." }],
    timestamp: Date.now(),
  });

  assert(sawToolExecution, "Agent did not execute the echo tool");
  assert(sawTextDelta, "Agent stream did not emit text deltas");
}

async function smokeCompleteObject(junior: JuniorModules) {
  const result = await junior.completeObject({
    modelId: FAST_MODEL,
    schema: z.object({
      ok: z.boolean(),
      label: z.string(),
    }),
    prompt:
      'Return JSON with ok set to true and label set to "openrouter-smoke".',
    maxTokens: 128,
  });

  assert(result.object.ok === true, "completeObject returned ok=false");
  assert(
    result.object.label === "openrouter-smoke",
    "completeObject returned unexpected label",
  );
}

async function smokeEmbeddings(junior: JuniorModules) {
  const result = await junior.embedTexts({
    modelId: EMBEDDING_MODEL,
    texts: ["openrouter smoke embedding"],
  });

  assert(
    result.dimensions === 1536,
    `unexpected embedding dimensions: ${result.dimensions}`,
  );
  assert(result.vectors.length === 1, "embedTexts returned wrong vector count");
}

async function smokeWebSearch(junior: JuniorModules) {
  const tool = junior.createWebSearchTool();
  assert(tool.execute, "webSearch execute function missing");

  const result = await tool.execute(
    { query: "OpenRouter web search documentation", max_results: 1 },
    {} as never,
  );
  const searchResult = result as unknown as {
    ok: boolean;
    result_count: number;
    results: Array<{ title?: string; url?: string; snippet?: string }>;
  };

  assert(
    searchResult.ok === true,
    `webSearch failed: ${JSON.stringify(result)}`,
  );
  assert(searchResult.result_count >= 1, "webSearch returned no results");
  const first = searchResult.results[0];
  assert(first?.title, "webSearch result missing title");
  assert(first.url, "webSearch result missing url");
  assert(first.snippet !== undefined, "webSearch result missing snippet");
}

async function smokeImageGeneration(junior: JuniorModules) {
  const tool = junior.createImageGenerateTool({
    writeGeneratedArtifacts: (files) =>
      files.map((file, index) => ({
        bytes:
          typeof file.data === "string"
            ? Buffer.byteLength(file.data)
            : file.data instanceof Blob
              ? file.data.size
              : file.data.byteLength,
        filename: file.filename,
        mimeType: file.mimeType,
        path: join(tmpdir(), `openrouter-smoke-${index}-${file.filename}`),
      })),
  });
  assert(tool.execute, "imageGenerate execute function missing");

  const result = await tool.execute(
    { prompt: "A tiny monochrome checkmark icon on a white background." },
    {} as never,
  );
  const imageResult = result as {
    ok: boolean;
    image_count: number;
    images: Array<{ bytes?: number }>;
  };

  assert(
    imageResult.ok === true,
    `imageGenerate failed: ${JSON.stringify(result)}`,
  );
  assert(imageResult.image_count >= 1, "imageGenerate returned no images");
  assert(
    (imageResult.images[0]?.bytes ?? 0) > 0,
    "imageGenerate returned empty image data",
  );
}

async function runStep(name: string, run: () => Promise<void>) {
  process.stdout.write(`- ${name}... `);
  await run();
  process.stdout.write("ok\n");
}

async function main() {
  loadLocalEnvFiles();

  if (
    process.env.AI_PROVIDER !== undefined &&
    process.env.AI_PROVIDER !== "openrouter"
  ) {
    throw new Error("openrouter:smoke requires AI_PROVIDER=openrouter");
  }
  process.env.AI_PROVIDER = "openrouter";
  if (!process.env.OPENROUTER_API_KEY?.trim()) {
    throw new Error(
      "OPENROUTER_API_KEY is required for OpenRouter smoke tests",
    );
  }
  process.env.DATABASE_URL ??= SMOKE_DATABASE_URL;

  const junior = await loadJuniorModules();

  await runStep("completeText", () => smokeCompleteText(junior));
  await runStep("completeText reasoning", () => smokeReasoning(junior));
  await runStep("Agent streaming tool roundtrip", () =>
    smokeAgentToolRoundtrip(junior),
  );
  await runStep("completeObject", () => smokeCompleteObject(junior));
  await runStep("embedTexts", () => smokeEmbeddings(junior));
  await runStep("webSearch", () => smokeWebSearch(junior));
  await runStep("imageGenerate", () => smokeImageGeneration(junior));
}

await main();
