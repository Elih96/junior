# Changelog
## 0.116.1

### Bug Fixes 🐛

- (sandbox) Install ripgrep from pinned release by @dcramer in [#1090](https://github.com/getsentry/junior/pull/1090)

## 0.116.0

### Breaking Changes 🛠

- (chat) Store native agent history events by @dcramer in [#1087](https://github.com/getsentry/junior/pull/1087)

### New Features ✨

#### Tools

- Back sandbox search with ripgrep by @dcramer in [#1086](https://github.com/getsentry/junior/pull/1086)
- Add deferred queryConversationEvents tool by @sentry-junior in [#1072](https://github.com/getsentry/junior/pull/1072)
- Describe approval proposals by @dcramer in [#1064](https://github.com/getsentry/junior/pull/1064)

#### Other

- (api) Add personal access tokens by @sentry-junior in [#1080](https://github.com/getsentry/junior/pull/1080)
- (github) Show conversation pull requests by @sentry-junior in [#1081](https://github.com/getsentry/junior/pull/1081)

### Bug Fixes 🐛

#### Sandbox

- Cancel file tools with agent turn by @dcramer in [#1067](https://github.com/getsentry/junior/pull/1067)
- Keep sandbox alive during long commands by @sentry-junior in [#1071](https://github.com/getsentry/junior/pull/1071)

#### Other

- (context) Preserve active instruction during compaction by @sentry-junior in [#1077](https://github.com/getsentry/junior/pull/1077)
- (dashboard) Clarify tool call metadata by @sentry-junior in [#1070](https://github.com/getsentry/junior/pull/1070)
- (tools) Bound readFile output by @dcramer in [#1085](https://github.com/getsentry/junior/pull/1085)

### Internal Changes 🔧

- (dispatch) Route dispatches through conversation work by @dcramer in [#1059](https://github.com/getsentry/junior/pull/1059)
- (plugins) Remove declared capabilities by @sentry-junior in [#1083](https://github.com/getsentry/junior/pull/1083)

## 0.115.0

### Breaking Changes 🛠

- (dashboard) Add dedicated System plugin pages by @dcramer in [#1058](https://github.com/getsentry/junior/pull/1058)

### New Features ✨

- (dashboard) Show continuation summaries by @dcramer in [#1056](https://github.com/getsentry/junior/pull/1056)
- (slack) Isolate cross-actor follow-up turns by @dcramer in [#1057](https://github.com/getsentry/junior/pull/1057)
- (tools) Declare approval modes by @dcramer in [#1055](https://github.com/getsentry/junior/pull/1055)

### Bug Fixes 🐛

- (cli) Continue local chat after account sign-in by @dcramer in [#1054](https://github.com/getsentry/junior/pull/1054)
- (github) Show median PR cost in ops repo grid by @sentry-junior in [#1049](https://github.com/getsentry/junior/pull/1049)

### Internal Changes 🔧

- Cap code files at 1,000 lines by @dcramer in [#1060](https://github.com/getsentry/junior/pull/1060)

## 0.114.0

### New Features ✨

- (dashboard) Improve collapsed tool call rendering by @dcramer in [#1046](https://github.com/getsentry/junior/pull/1046)

### Bug Fixes 🐛

- (agent) Enforce context window compaction by @dcramer in [#1045](https://github.com/getsentry/junior/pull/1045)
- (ai) Handle invalid structured responses by @dcramer in [#1043](https://github.com/getsentry/junior/pull/1043)
- (conversations) Preserve transcript formatting by @dcramer in [#1044](https://github.com/getsentry/junior/pull/1044)
- (runtime) Separate turn routes from handoffs by @sentry-junior in [#1037](https://github.com/getsentry/junior/pull/1037)

## 0.113.0

### New Features ✨

- (github) Track PR and issue conversation costs by @sentry-junior in [#1040](https://github.com/getsentry/junior/pull/1040)

### Bug Fixes 🐛

- (agent) Prevent duplicate replies after cooperative yield by @dcramer in [#1042](https://github.com/getsentry/junior/pull/1042)
- (provider) Normalize terminal failures by @sentry-junior in [#907](https://github.com/getsentry/junior/pull/907)

### Internal Changes 🔧

- (dashboard) Paginate conversation transcripts by @sentry-junior in [#1017](https://github.com/getsentry/junior/pull/1017)
- (evals) Gate runs on eval changes or label by @sentry-junior in [#1039](https://github.com/getsentry/junior/pull/1039)

## 0.112.0

### New Features ✨

- (auth) Include model intent in all authorization requests by @sentry-junior in [#1024](https://github.com/getsentry/junior/pull/1024)
- (dashboard) Add profile metric charts by @sentry-junior in [#1035](https://github.com/getsentry/junior/pull/1035)

### Bug Fixes 🐛

- (agent) Stop resource watches when users ask by @dcramer in [#1032](https://github.com/getsentry/junior/pull/1032)
- (dashboard) Break down cost by model by @sentry-junior in [#1034](https://github.com/getsentry/junior/pull/1034)
- (github) Simplify dashboard activity reporting by @dcramer in [#1033](https://github.com/getsentry/junior/pull/1033)

### Internal Changes 🔧

- (oauth) Complete headless MCP auth fixture by @dcramer in [#847](https://github.com/getsentry/junior/pull/847)

## 0.111.0

### Bug Fixes 🐛

#### Runtime

- Keep deferred messages out of active turns by @sentry-junior in [#1014](https://github.com/getsentry/junior/pull/1014)
- Derive deadlines from Nitro max duration by @sentry-junior in [#1029](https://github.com/getsentry/junior/pull/1029)

#### Other

- (dashboard) Reflect expanded tool call groups by @sentry-junior in [#1028](https://github.com/getsentry/junior/pull/1028)
- (evals) Stabilize model-backed scenarios by @dcramer in [#1022](https://github.com/getsentry/junior/pull/1022)
- (sandbox) Recover safely from unavailable sessions by @dcramer in [#1012](https://github.com/getsentry/junior/pull/1012)

### Internal Changes 🔧

- (github) Cover interrupted push reconciliation by @sentry-junior in [#919](https://github.com/getsentry/junior/pull/919)
- (runtime) Continue paused work in the same worker by @dcramer in [#1023](https://github.com/getsentry/junior/pull/1023)

## 0.110.0

### New Features ✨

- (agent-browser) Add visual web QA skill by @dcramer in [#1020](https://github.com/getsentry/junior/pull/1020)
- (api) Authorize private transcripts for participants by @sentry-junior in [#981](https://github.com/getsentry/junior/pull/981)
- (reporting) Render plugin chart widgets by @sentry-junior in [#1010](https://github.com/getsentry/junior/pull/1010)

### Bug Fixes 🐛

#### Dashboard

- Show model handoff details by @sentry-junior in [#1016](https://github.com/getsentry/junior/pull/1016)
- Simplify plugin inventory by @sentry-junior in [#1018](https://github.com/getsentry/junior/pull/1018)

#### Other

- (auth) Catch authorization pauses inside agent spans by @sentry-junior in [#1015](https://github.com/getsentry/junior/pull/1015)
- (github) Enforce authoritative commit coauthors by @sentry-junior in [#1021](https://github.com/getsentry/junior/pull/1021)

### Documentation 📚

- Clarify repository agent guidance by @dcramer in [#1026](https://github.com/getsentry/junior/pull/1026)

### Internal Changes 🔧

- (queue) Use conversation IDs in callbacks by @dcramer in [#1019](https://github.com/getsentry/junior/pull/1019)

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

