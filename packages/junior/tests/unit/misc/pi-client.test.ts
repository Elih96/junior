import { afterEach, describe, expect, it } from "vitest";
import { getGatewayApiKey, getPiGatewayApiKey } from "@/chat/pi/client";

const ORIGINAL_ENV = {
  OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,
};

function restoreEnvVar(name: keyof typeof ORIGINAL_ENV): void {
  const value = ORIGINAL_ENV[name];
  if (value === undefined) {
    delete process.env[name];
    return;
  }
  process.env[name] = value;
}

describe("getGatewayApiKey", () => {
  afterEach(() => {
    restoreEnvVar("OPENROUTER_API_KEY");
  });

  it("uses the explicit OpenRouter API key", () => {
    process.env.OPENROUTER_API_KEY = "  api-key  ";

    expect(getGatewayApiKey()).toBe("api-key");
  });

  it("returns undefined when no OpenRouter API key is configured", () => {
    delete process.env.OPENROUTER_API_KEY;

    expect(getGatewayApiKey()).toBeUndefined();
  });
});

describe("getPiGatewayApiKey", () => {
  afterEach(() => {
    restoreEnvVar("OPENROUTER_API_KEY");
  });

  it("returns the OpenRouter API key for Pi Agent auth hooks", () => {
    process.env.OPENROUTER_API_KEY = "api-key";

    expect(getPiGatewayApiKey()).toBe("api-key");
  });

  it("returns undefined when no OpenRouter API key is configured", () => {
    delete process.env.OPENROUTER_API_KEY;

    expect(getPiGatewayApiKey()).toBeUndefined();
  });
});
