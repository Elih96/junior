# Amplitude Skill Specification

## Classification

- Class: `integration-documentation`
- Primary execution shape: `inline-guidance`
- Simpler-shape decision: one coherent workflow is sufficient; references or scripts would duplicate live MCP schemas.
- Portability: provider-specific MCP discovery is isolated to Junior's standard bridge tools.

## Intent

Answer product analytics questions from Amplitude while preventing the agent from invoking any provider tool outside the package's documented read-tool allowlist.

## Trigger expectations

Should trigger for:

- DAU, WAU, MAU, active users, or new users in Amplitude
- event counts, uniques, sessions, or property segmentation
- funnel conversion and drop-off analysis
- retention analysis
- saved Amplitude chart interpretation
- experiment, taxonomy-property, session-replay, feature-flag, guide, survey, feedback, agent-analytics, Wave, data-warehouse, or user-activity inspection

Should not trigger for:

- repository code or telemetry that merely mentions Amplitude
- implementing Amplitude instrumentation or SDK setup
- creating or editing Amplitude resources
- analytics questions explicitly assigned to another provider

## Runtime invariants

1. Load the live Amplitude MCP catalog through Junior's provider bridge.
2. Use exact discovered tool names and schemas.
3. Expose only official Amplitude tools whose full contract is read-only.
4. Never bypass MCP filtering through direct HTTP or shell calls.
5. Preserve explicit identifiers, filters, and time ranges.
6. State assumptions and distinguish users, events, sessions, and percentages.
7. Exclude mixed tools that combine read and mutation operations.

## Validation

- `pnpm skills:check`
- `pnpm --filter @sentry/junior exec vitest run tests/component/plugins/amplitude-plugin.test.ts`
- `pnpm release:check`
- Pack `@sentry/junior-amplitude` and inspect the archive contents.
- Manual OAuth smoke test through `pnpm cli -- chat ...` when an Amplitude account is available.

## Maintenance

- Update `SKILL.md` when supported read-only workflows or user-facing guardrails change.
- Update `SOURCES.md` when Amplitude MCP endpoints, authentication, access controls, or marketplace guidance changes.
- Update this file when trigger boundaries, runtime invariants, or validation requirements change.
