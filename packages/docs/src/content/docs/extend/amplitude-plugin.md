---
title: Amplitude Plugin
description: Configure read-only Amplitude product analytics through Amplitude's hosted MCP server.
type: tutorial
summary: Connect Junior to Amplitude for read-only product analytics in Slack.
prerequisites:
  - /extend/
related:
  - /concepts/credentials-and-oauth/
  - /operate/security-hardening/
---

The Amplitude plugin lets Slack users inspect product usage, active users, event segmentation, funnels, retention, saved charts, experiments, selected taxonomy data, session replay, feature flags, guides and surveys, feedback, agent analytics, Wave, data warehouse status, and user activity. The plugin does not grant Junior access to mutation tools.

Junior connects to Amplitude's hosted MCP server and starts Amplitude's OAuth flow when a user first requests analytics. The plugin exposes a fixed allowlist of tools whose full contract is read-only. Tools that Amplitude does not return for an account, region, or rollout stay unavailable without disabling the other read-only tools.

## Install

Install the plugin package alongside `@sentry/junior`:

```bash
pnpm add @sentry/junior @sentry/junior-amplitude
```

## Runtime setup

Add the package name to the plugin set exported from `plugins.ts`:

```ts title="plugins.ts"
import { defineJuniorPlugins } from "@sentry/junior";

export const plugins = defineJuniorPlugins(["@sentry/junior-amplitude"]);
```

No Amplitude API key or secret key is required. Each user authorizes through Amplitude's hosted MCP OAuth flow, and Junior resumes the original conversation after authorization completes.

## Config

### Environment variables

<details class="plugin-config">
<summary><code>AMPLITUDE_MCP_URL</code></summary>

MCP endpoint for the Amplitude data region this Junior deployment uses.

- **Define:** Set `AMPLITUDE_MCP_URL` in the deployment environment, then redeploy
- **Default:** `https://mcp.amplitude.com/mcp` (US)
- **Required:** No
- **Environment override:** `AMPLITUDE_MCP_URL`

Use the regional HTTPS endpoint documented by Amplitude when your data is not in the US region.

</details>

## Read-only boundary

The plugin uses `allowed-tools` to expose only tools whose full contract is read-only. Rendering, creation, editing, updates, sync, sharing, taxonomy branch mutation, merge, and deletion tools never enter Junior's callable MCP catalog.

Amplitude combines some reads and changes in one MCP tool. Junior excludes these mixed tools in full. This rule means that dashboard, notebook, cohort, event-management, comment, sharing, monitor, and tracking-plan branch tools are unavailable through this read-only plugin.

This allowlist is a client-side exposure boundary. Amplitude authorization remains the provider-side permission boundary. For defense in depth, grant connected users or service accounts `USE_MCP_READ` only and remove `USE_MCP_WRITE` from their project role. Amplitude's Member, Manager, and Admin roles include MCP write access by default until an administrator adjusts the role.

The plugin does not use Amplitude's progressive-discovery URL. Junior already loads provider catalogs on demand through `searchMcpTools`, while the standard endpoint supplies the complete catalog that Junior can filter before exposure.

### Allowed tools

The package exposes this exact provider tool surface:

```text
search
get_from_url
get_amplitude_context
query_amplitude_data
get_amplitude_charts
get_amp_user_data
get_experiments
query_experiment
get_flags
get_deployments
get_properties
get_transformations
get_group_types
get_session_replays
list_session_replays
get_session_replay_events
list_guides_surveys
get_guide_or_survey
query_wave_opportunities
query_wave_product_areas
use_amplitude_ai_feedback
get_agent_results
get_amplitude_agent_analytics_info
get_data_ingestion_sources
get_data_source_details
get_data_warehouse_destinations
get_data_warehouse_jobs
```

Every other Amplitude MCP tool is unavailable through the plugin. When Amplitude adds another read operation, the package must explicitly add it before Junior can call it. A documented tool is exposed only when the connected MCP server returns it during discovery.

## What users can query

- DAU, WAU, MAU, and other active-user trends
- event totals, unique users, sessions, and property segmentation
- funnel conversion and step drop-off
- retention by cohort and interval
- saved chart definitions and results
- experiment status and results
- taxonomy properties, transformations, and group types
- session replay timelines and prior agent-analysis results
- feature flag definitions
- guides, surveys, customer feedback, and agent analytics
- Wave opportunities and product areas
- data ingestion sources, export destinations, and job history
- individual user activity when the connected account has access

Render, create, update, archive, delete, launch, stop, sync-trigger, and configuration operations are unavailable through this plugin. The skill also instructs Junior not to expose deployment API keys, credential fields, or unrelated raw feedback and conversation content returned by read tools.

## Verify

1. Ask Junior for an Amplitude metric, such as active users for the last seven days.
2. Complete the private Amplitude OAuth flow when Junior prompts for it.
3. Confirm the original conversation resumes with an analytics result.
4. Ask Junior to create or edit an Amplitude chart and confirm it explains that the plugin is read-only.

## Failure modes

- **Authorization required:** Retry the analytics request and complete the private OAuth flow.
- **Permission denied:** The connected Amplitude account cannot access the requested organization, project, or resource.
- **No matching tool:** The requested operation is not in the package's read-only tool allowlist.
- **Wrong region:** Set `AMPLITUDE_MCP_URL` to the correct regional MCP endpoint and restart the deployment.
- **Ambiguous project:** Name the Amplitude project or provide a chart, experiment, source, destination, or user identifier.

## Next step

Review [Credentials & OAuth](/concepts/credentials-and-oauth/) and [Security Hardening](/operate/security-hardening/).
