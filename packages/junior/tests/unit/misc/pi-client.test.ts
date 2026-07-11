import { afterEach, describe, expect, it, vi } from "vitest";
import {
  getAiProviderApiKey,
  getPiApiKey,
  resolveAiProvider,
} from "@/chat/pi/client";

const ORIGINAL_ENV = {
  AI_GATEWAY_API_KEY: process.env.AI_GATEWAY_API_KEY,
  AI_PROVIDER: process.env.AI_PROVIDER,
  OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,
  VERCEL_OIDC_TOKEN: process.env.VERCEL_OIDC_TOKEN,
};

function restoreEnvVar(name: keyof typeof ORIGINAL_ENV): void {
  const value = ORIGINAL_ENV[name];
  if (value === undefined) {
    delete process.env[name];
    return;
  }
  process.env[name] = value;
}

describe("AI provider selection", () => {
  afterEach(() => {
    for (const name of Object.keys(ORIGINAL_ENV) as Array<
      keyof typeof ORIGINAL_ENV
    >) {
      restoreEnvVar(name);
    }
    vi.resetModules();
  });

  it("defaults to OpenRouter", () => {
    expect(resolveAiProvider(undefined)).toBe("openrouter");
  });

  it("accepts Vercel AI Gateway", () => {
    expect(resolveAiProvider(" vercel-ai-gateway ")).toBe("vercel-ai-gateway");
  });

  it("rejects unknown providers", () => {
    expect(() => resolveAiProvider("other")).toThrow(
      "AI_PROVIDER must be openrouter or vercel-ai-gateway",
    );
  });

  it("uses the explicit OpenRouter API key", () => {
    process.env.OPENROUTER_API_KEY = "  api-key  ";

    expect(getAiProviderApiKey()).toBe("api-key");
    expect(getPiApiKey()).toBe("api-key");
  });

  it("returns undefined when no OpenRouter API key is configured", () => {
    delete process.env.OPENROUTER_API_KEY;

    expect(getAiProviderApiKey()).toBeUndefined();
    expect(getPiApiKey()).toBeUndefined();
  });

  it("uses Gateway API key auth when Gateway is selected", async () => {
    process.env.AI_PROVIDER = "vercel-ai-gateway";
    process.env.AI_GATEWAY_API_KEY = " gateway-key ";
    delete process.env.VERCEL_OIDC_TOKEN;
    vi.resetModules();
    const { GEN_AI_PROVIDER_NAME, getAiProviderApiKey } =
      await import("@/chat/pi/client");

    expect(GEN_AI_PROVIDER_NAME).toBe("vercel-ai-gateway");
    expect(getAiProviderApiKey()).toBe("gateway-key");
  });

  it("uses Gateway OIDC auth when no API key is configured", async () => {
    process.env.AI_PROVIDER = "vercel-ai-gateway";
    delete process.env.AI_GATEWAY_API_KEY;
    process.env.VERCEL_OIDC_TOKEN = " oidc-token ";
    vi.resetModules();
    const { getAiProviderApiKey } = await import("@/chat/pi/client");

    expect(getAiProviderApiKey()).toBe("oidc-token");
  });
});
