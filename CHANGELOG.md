# Changelog
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

