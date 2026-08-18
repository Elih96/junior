# `@sentry/junior-amplitude`

Read-only Amplitude product analytics for Junior through Amplitude's hosted MCP server.

## Install

```bash
pnpm add @sentry/junior @sentry/junior-amplitude
```

```ts
import { defineJuniorPlugins } from "@sentry/junior";

export const plugins = defineJuniorPlugins(["@sentry/junior-amplitude"]);
```

Junior starts Amplitude's per-user OAuth flow when the agent first needs Amplitude data. The plugin exposes a fixed allowlist of Amplitude tools whose full contract is read-only. The tools cover analytics, charts, users, experiments, feature flags, selected taxonomy data, session replay, guides and surveys, feedback, agent analytics, Wave, and data warehouse status.

Amplitude combines some reads and changes in one MCP tool. Junior excludes these mixed tools in full. Rendering, creation, editing, update, sync, sharing, merge, and deletion tools are not available to the agent.

The default MCP endpoint is `https://mcp.amplitude.com/mcp`. Set `AMPLITUDE_MCP_URL` to the regional endpoint documented by Amplitude when the deployment uses another data region.

Full setup guide: https://junior.sentry.dev/extend/amplitude-plugin/
