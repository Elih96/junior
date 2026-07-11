# GitHub Actions Eval Setup

Use this when you want PR evals to run in GitHub Actions.

Current repo state: this is not intended to be configured right now. Keep this as future setup guidance unless we explicitly decide to turn PR evals on with real GitHub secrets.

## Required Secrets

Recommended:

- `OPENROUTER_API_KEY`
- `VERCEL_OIDC_TOKEN`

This uses Junior's default OpenRouter provider for model calls and Vercel OIDC for Sandbox access.

To use Vercel AI Gateway instead, set the repository variable `AI_PROVIDER` to `vercel-ai-gateway`. With that selection, `VERCEL_OIDC_TOKEN` covers both model calls and Sandbox access, so `OPENROUTER_API_KEY` is not required.

Optional fallback if you do not want to use OIDC:

- `AI_GATEWAY_API_KEY`
- `VERCEL_TOKEN`
- `VERCEL_TEAM_ID`
- `VERCEL_PROJECT_ID`

## How To Get Them

### `VERCEL_OIDC_TOKEN`

From the repo root:

```bash
pnpm dlx vercel link
pnpm dlx vercel env pull
```

Then copy `VERCEL_OIDC_TOKEN` from `.env.local` into the GitHub repository secret `VERCEL_OIDC_TOKEN`.

This is the preferred Sandbox authentication path. It also authenticates model calls when `AI_PROVIDER=vercel-ai-gateway`.

### `OPENROUTER_API_KEY`

Create an API key in OpenRouter and add it to GitHub as `OPENROUTER_API_KEY`. This is required when `AI_PROVIDER` is unset or set to `openrouter`.

### Optional: token-based fallback

### `VERCEL_TOKEN`

1. Open Vercel account settings.
2. Create an access token.
3. Scope it to the team that owns the `junior` project.
4. Add it to GitHub as `VERCEL_TOKEN`.

### `VERCEL_TEAM_ID` and `VERCEL_PROJECT_ID`

From the repo root:

```bash
pnpm dlx vercel link
cat .vercel/project.json
```

Use:

- `orgId` as `VERCEL_TEAM_ID`
- `projectId` as `VERCEL_PROJECT_ID`

Current local link metadata lives in [.vercel/project.json](/home/dcramer/src/junior/.vercel/project.json).

### `AI_GATEWAY_API_KEY`

Only needed when `AI_PROVIDER=vercel-ai-gateway` and Vercel OIDC is unavailable for model authentication. Create an AI Gateway key in the Vercel dashboard and add it as `AI_GATEWAY_API_KEY`.

## Triggering Evals On A PR

The `Evals` workflow runs on pull requests when either:

- eval-related files changed
- the PR has the `trigger-evals` label

Adding the `trigger-evals` label fires the workflow immediately. If the label is already on the PR, future `synchronize` events still run evals.

## Verification

After adding secrets:

1. Push a commit to the PR, or add the `trigger-evals` label.
2. Open the `Evals` workflow summary.
3. Confirm the gate reports:
   - `provider_ready: true`
   - `sandbox_ready: true`
   - `will_run: true`

If `sandbox_ready` is false, either `VERCEL_OIDC_TOKEN` is missing or the fallback token set is incomplete.

If `provider_ready` is false, `OPENROUTER_API_KEY` is missing for OpenRouter, or both `AI_GATEWAY_API_KEY` and `VERCEL_OIDC_TOKEN` are missing for AI Gateway.
