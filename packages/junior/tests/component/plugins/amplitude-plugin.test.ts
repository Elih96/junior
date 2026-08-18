import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";

const { listToolsMock } = vi.hoisted(() => ({
  listToolsMock: vi.fn(),
}));

vi.mock("@/chat/mcp/client", () => ({
  McpAuthorizationRequiredError: class extends Error {},
  PluginMcpClient: class {
    async listTools() {
      return await listToolsMock();
    }

    async close() {}
  },
}));

import { McpToolManager } from "@/chat/mcp/tool-manager";

const originalCwd = process.cwd();
// Reviewed against Amplitude's official MCP tool roster on 2026-08-18.
const readOnlyTools = [
  "search",
  "get_from_url",
  "get_amplitude_context",
  "query_amplitude_data",
  "get_amplitude_charts",
  "get_amp_user_data",
  "get_experiments",
  "query_experiment",
  "get_flags",
  "get_deployments",
  "get_properties",
  "get_transformations",
  "get_group_types",
  "get_session_replays",
  "list_session_replays",
  "get_session_replay_events",
  "list_guides_surveys",
  "get_guide_or_survey",
  "query_wave_opportunities",
  "query_wave_product_areas",
  "use_amplitude_ai_feedback",
  "get_agent_results",
  "get_amplitude_agent_analytics_info",
  "get_data_ingestion_sources",
  "get_data_source_details",
  "get_data_warehouse_destinations",
  "get_data_warehouse_jobs",
];
const blockedTools = [
  "render_amplitude_chart",
  "use_amplitude_chart_monitors",
  "use_amp_dashboards",
  "use_amp_notebooks",
  "use_amp_comments",
  "share_amp_entities",
  "use_amplitude_cohorts",
  "create_experiment",
  "update_experiment",
  "create_metric",
  "create_flags",
  "update_flag",
  "manage_amp_events",
  "create_properties",
  "update_properties",
  "manage_amp_data_taxonomy",
  "manage_wave_opportunities",
  "manage_wave_product_areas",
  "manage_wave_verification_artifacts",
];

afterEach(() => {
  process.chdir(originalCwd);
  vi.resetModules();
  vi.doUnmock("@/chat/discovery");
  listToolsMock.mockReset();
});

describe("Amplitude plugin package", () => {
  it("discovers the shipped manifest and exposes only allowlisted MCP tools", async () => {
    const tempRoot = await fs.mkdtemp(
      path.join(os.tmpdir(), "junior-amplitude-package-"),
    );
    const packageRoot = path.join(
      tempRoot,
      "node_modules",
      "@sentry",
      "junior-amplitude",
    );
    await fs.mkdir(path.dirname(packageRoot), { recursive: true });
    await fs.cp(
      path.resolve(import.meta.dirname, "../../../../junior-amplitude"),
      packageRoot,
      { recursive: true },
    );
    await fs.writeFile(
      path.join(tempRoot, "package.json"),
      JSON.stringify({
        name: "amplitude-test-app",
        private: true,
        dependencies: { "@sentry/junior-amplitude": "0.94.0" },
      }),
      "utf8",
    );
    process.chdir(tempRoot);

    vi.resetModules();
    vi.doMock("@/chat/discovery", async (importOriginal) => ({
      ...(await importOriginal<typeof import("@/chat/discovery")>()),
      pluginRoots: () => [],
    }));

    const { pluginCatalogRuntime } =
      await import("@/chat/plugins/catalog-runtime");
    pluginCatalogRuntime.setConfig({
      packages: ["@sentry/junior-amplitude"],
    });
    const providers = pluginCatalogRuntime.getProviders();

    expect(providers).toHaveLength(1);
    expect(providers[0]?.manifest.mcp).toMatchObject({
      url: "https://mcp.amplitude.com/mcp",
    });
    const allowedTools = providers[0]?.manifest.mcp?.allowedTools;
    expect(allowedTools).toEqual(readOnlyTools);

    listToolsMock.mockResolvedValue(
      [...readOnlyTools, ...blockedTools].map((name) => ({
        name,
        description: `Amplitude ${name}`,
        inputSchema: { type: "object", properties: {} },
      })),
    );

    const manager = new McpToolManager(providers);
    await manager.activateProvider("amplitude");

    expect(manager.getActiveToolCatalog().map((tool) => tool.rawName)).toEqual(
      readOnlyTools,
    );
  });
});
