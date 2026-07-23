# Changelog
## 0.109.0

### Breaking Changes 🛠

- (upgrade) Use Drizzle migrations exclusively by @dcramer in [#1011](https://github.com/getsentry/junior/pull/1011)
- (vercel) Add deployment webhook subscriptions by @dcramer in [#1008](https://github.com/getsentry/junior/pull/1008)

### New Features ✨

- (dashboard) Render resource events structurally by @sentry-junior in [#1003](https://github.com/getsentry/junior/pull/1003)
- (docs) Add homepage customer logos by @sentry-junior in [#1001](https://github.com/getsentry/junior/pull/1001)
- (telemetry) Report Junior package version by @sentry-junior in [#905](https://github.com/getsentry/junior/pull/905)

### Bug Fixes 🐛

#### Dashboard

- Simplify and align conversation metrics by @sentry-junior in [#1013](https://github.com/getsentry/junior/pull/1013)
- Render transcript markdown hard breaks by @sentry-junior in [#1006](https://github.com/getsentry/junior/pull/1006)
- Render tool results in transcripts by @dcramer in [#999](https://github.com/getsentry/junior/pull/999)

#### Github

- Report work outcomes instead of open counts by @sentry-junior in [#1004](https://github.com/getsentry/junior/pull/1004)
- Use user credentials for asset uploads by @sentry-junior in [#1002](https://github.com/getsentry/junior/pull/1002)

#### Other

- (agent) Trust event summaries and clarify GitHub auth by @dcramer in [#1005](https://github.com/getsentry/junior/pull/1005)
- (mcp) Skip credentialless provider restoration by @dcramer in [#1009](https://github.com/getsentry/junior/pull/1009)
- (slack) Restore conversation footers on assistant replies by @sentry-junior in [#986](https://github.com/getsentry/junior/pull/986)

### Documentation 📚

- (start-here) Restore agent onboarding runbook by @sentry-junior in [#996](https://github.com/getsentry/junior/pull/996)

### Internal Changes 🔧

- (docs) Bump starlight theme to 0.9.1 by @sentry-junior in [#1007](https://github.com/getsentry/junior/pull/1007)
- (logging) Decouple async log context by @sentry-junior in [#970](https://github.com/getsentry/junior/pull/970)
- (runtime) Simplify resumed turn commits by @dcramer in [#995](https://github.com/getsentry/junior/pull/995)

## 0.108.0

### New Features ✨

- (dashboard) Archive conversations from sidebar by @dcramer in [#988](https://github.com/getsentry/junior/pull/988)
- (github) Add issue and PR outcome analytics by @dcramer in [#990](https://github.com/getsentry/junior/pull/990)

### Bug Fixes 🐛

#### Dashboard

- Show plugin reports above capability inventories by @sentry-junior in [#998](https://github.com/getsentry/junior/pull/998)
- Remove conversation status badges by @dcramer in [#997](https://github.com/getsentry/junior/pull/997)

#### Other

- (agent) Continue after execution-slice timeouts by @dcramer in [#977](https://github.com/getsentry/junior/pull/977)
- (conversations) Project compacted history consistently by @dcramer in [#989](https://github.com/getsentry/junior/pull/989)
- (identity) Use canonical user names in conversations by @dcramer in [#983](https://github.com/getsentry/junior/pull/983)
- (runtime) Validate durable state boundaries by @dcramer in [#994](https://github.com/getsentry/junior/pull/994)
- (sandbox) Avoid command log lookup races by @dcramer in [#992](https://github.com/getsentry/junior/pull/992)
- (scheduler) Compute next runs from structured intent by @dcramer in [#984](https://github.com/getsentry/junior/pull/984)
- (self-update) Use GitHub release notes for release context by @sentry-junior in [#985](https://github.com/getsentry/junior/pull/985)
- (slack) Cancel resource watches on thread stop by @dcramer in [#987](https://github.com/getsentry/junior/pull/987)
- (state) Connect adapter lazily before operations by @schibrikov in [#980](https://github.com/getsentry/junior/pull/980)

### Internal Changes 🔧

- (agent) Stabilize wall-clock provider retry timer wait by @sentry-junior in [#991](https://github.com/getsentry/junior/pull/991)
- (docs) Bump starlight theme to 0.8.0 by @sentry-junior in [#1000](https://github.com/getsentry/junior/pull/1000)
- (evals) Cover OAuth connection and refresh flows by @dcramer in [#993](https://github.com/getsentry/junior/pull/993)

## 0.107.1

### Bug Fixes 🐛

- (migrations) Preserve history without compaction summary by @dcramer in [#982](https://github.com/getsentry/junior/pull/982)

## 0.107.0

### Breaking Changes 🛠

- (conversations) Unify durable conversation history by @dcramer in [#916](https://github.com/getsentry/junior/pull/916)

### New Features ✨

#### Dashboard

- Break down token usage by model by @sentry-junior in [#962](https://github.com/getsentry/junior/pull/962)
- Show typing indicator for active turns by @sentry-junior in [#961](https://github.com/getsentry/junior/pull/961)

#### Github

- Track Junior pull request outcomes by @dcramer in [#976](https://github.com/getsentry/junior/pull/976)
- Add pull request update tool by @sentry-junior in [#963](https://github.com/getsentry/junior/pull/963)

#### Other

- (agent) Deliver completed assistant messages by @dcramer in [#969](https://github.com/getsentry/junior/pull/969)

### Bug Fixes 🐛

#### Agent

- Force handoff profile to high reasoning by @dcramer in [#978](https://github.com/getsentry/junior/pull/978)
- Route complex turns through execution profiles by @dcramer in [#974](https://github.com/getsentry/junior/pull/974)
- Hide tool-call narration from replies by @dcramer in [#972](https://github.com/getsentry/junior/pull/972)
- Preserve generated artifact paths by @dcramer in [#971](https://github.com/getsentry/junior/pull/971)
- Align model defaults and eval contracts by @dcramer in [#964](https://github.com/getsentry/junior/pull/964)

#### Other

- (memory) Reuse semantic preference duplicates by @dcramer in [#973](https://github.com/getsentry/junior/pull/973)
- (slack) Resume turns after transient reply failures by @dcramer in [#975](https://github.com/getsentry/junior/pull/975)

### Internal Changes 🔧

#### Evals

- Organize and shard end-to-end suites by @sentry-junior in [#968](https://github.com/getsentry/junior/pull/968)
- Accept explicit Slack URL links by @dcramer in [#967](https://github.com/getsentry/junior/pull/967)
- Add isolated global sandbox egress by @dcramer in [#943](https://github.com/getsentry/junior/pull/943)

