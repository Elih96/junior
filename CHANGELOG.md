# Changelog
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

