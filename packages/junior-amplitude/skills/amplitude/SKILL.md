---
name: amplitude
description: Query read-only Amplitude product analytics. Use when users ask about active users, product usage, events, segmentation, funnels, conversion, retention, charts, experiments, taxonomy properties, session replay, feature flags, guides, surveys, feedback, agent analytics, Wave, data warehouse status, or individual user activity in Amplitude. Do not use for changing Amplitude resources or project configuration.
---

# Amplitude Analytics

Use this skill for read-only product analytics through Amplitude's hosted MCP server.

## Workflow

1. Define the question before querying:

- Identify the metric or analysis type: active users, event segmentation, funnel, retention, chart, experiment, taxonomy property, session replay, feature flag, guide or survey, feedback, agent analytics, Wave, data warehouse status, or user activity.
- Preserve explicit event names, property names, chart IDs, experiment IDs, source IDs, destination IDs, and user IDs exactly.
- Use the user's explicit time range. For relative ranges, state the concrete dates in the answer.
- If the request has no time range, use the shortest conventional range that answers it and state the assumption.

2. Discover the current Amplitude tool:

- Inspect the available Amplitude MCP tools for the required analysis.
- Use the exact live tool name and schema. Do not guess Amplitude MCP tool names or arguments.
- Prefer direct chart, experiment, user, source, or destination lookup when the user provides its identifier.
- If project or organization scope is ambiguous, inspect accessible scope through the read-only catalog and ask one focused question only when multiple plausible targets remain.

3. Query narrowly:

- Request only the events, properties, segments, metrics, and dates needed for the answer.
- Prefer one complete query over several overlapping queries.
- For comparisons, keep metric definitions and windows consistent.
- Stop once the requested result is supported; do not enumerate unrelated project metadata.

4. Report the result:

- Lead with the metric, trend, conversion, retention, or experiment finding.
- Include the date range, project or scope, filters, and metric definition needed to interpret it.
- Distinguish unique users, event totals, sessions, and percentages explicitly.
- Include Amplitude links returned by the MCP server when available.
- State when data is empty, delayed, inaccessible, or insufficient rather than inferring a value.

## Common Analyses

- **DAU, WAU, MAU:** use active-user or event-segmentation tools with the requested interval and clarify whether the result is unique users or event totals.
- **Event segmentation:** preserve the exact event and property filters; report the aggregation and interval.
- **Funnels:** preserve ordered steps, conversion window, exclusions, and segment filters; report overall conversion and material drop-off steps.
- **Retention:** report the starting event, returning event, cohort interval, and retention horizon.
- **Saved charts:** fetch by ID when available and summarize the returned definition and results without recreating the analysis from memory.
- **Experiments:** report status, variants, exposure window, primary metric, and result confidence exactly as returned.
- **Session replay:** narrow by time, user, or event before retrieving replay details; summarize only the interactions needed to answer the question.
- **Feature flags:** report definitions, variants, and configuration without exposing deployment API keys or other credential fields.
- **Taxonomy:** report properties, transformations, and group types. Do not imply that the plugin can manage events or tracking-plan branches.
- **Guides, surveys, and feedback:** preserve source and date filters, distinguish processed themes from raw comments, and avoid returning unrelated customer text.
- **Agent analytics:** distinguish sessions, spans, conversations, quality metrics, cost, and latency; return transcript content only when the user explicitly requests it.
- **Wave:** distinguish opportunities from product areas and preserve their identifiers.
- **Data warehouse:** distinguish ingestion sources, export destinations, and job history. Report status, timing, processed records, and returned failure reasons exactly.
- **User activity:** use an explicit user identifier when possible and avoid exposing unrelated profile properties or event history.

## Guardrails

- Read-only only. The plugin exposes a fixed allowlist of Amplitude tools whose full contract is read-only.
- Do not create, update, archive, delete, launch, stop, or otherwise modify Amplitude resources.
- Do not use a mixed Amplitude tool that combines read and mutation operations, even when the requested operation sounds read-only.
- If the user asks for a change, explain that this plugin is read-only and offer to inspect the current state or describe the change they would need to make.
- Do not weaken or bypass the plugin's tool filter, including by calling Amplitude APIs through shell commands.
- Treat event and user properties as potentially sensitive. Return only fields needed to answer the request.
- Never expose API keys, credential fields, or unrelated conversation and feedback content returned by read tools.
- Do not fabricate event names, property values, metric definitions, experiment conclusions, or missing data.
- On authorization failure, let Junior present Amplitude's OAuth flow. On permission failure, report that the connected Amplitude account cannot access the requested scope.
