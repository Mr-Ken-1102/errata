# Changelog

All notable changes to Errata are documented here. Format loosely follows
[Keep a Changelog](https://keepachangelog.com/); versions are git tags.

## [1.0.1] — 2026-10-09

Maintenance release: post-audit safety fixes from PR #50. No new features or story-data format changes.

### Fixed
- Desktop updates now require a successful story-data backup before installation;
  backup failures surface an error and allow retry without proceeding unsafely.
- Release documentation reflects the published v1.0.0 tag, assets and provenance.
- Generated route declarations are synchronized with the pinned build toolchain.

## [1.0.0] — 2026-09-28 (published)

**Release identity:** **Errata v1.0** is the first curated release line of
`Mr-Ken-1102/errata`. It is based on upstream `tealios/errata` v1.12.0
(2026-09-14, commit `610c7e7587fe334f0908dd2065f9be7c4761a0dc`) plus selectively
integrated and adapted work from audited Errata forks. The upstream project has
continued beyond that baseline; newer upstream commits are intentionally not
silently merged into this v1.0 release line. See
[`RELEASE_PROVENANCE.md`](RELEASE_PROVENANCE.md) for source lineage and
integration checkpoints.

### Added
- **Server-owned durable runs** for generation, Librarian refine/transform/chat,
  and Character Chat, with cursor replay, reconnect support, idempotent retries,
  and explicit Stop semantics that abort the model without committing partial prose.
- **Story Presets** for reusable character, guideline, and knowledge bundles with
  self-contained reference remapping, copy isolation, provenance, and rollback on
  failed application.
- **Branch-aware POV and character Voice controls**, including Unicode/Vietnamese
  voice preservation and POV propagation through generation, refinement, and
  Librarian metadata.
- **Standalone SillyTavern lorebook import** with parser and drag-and-drop UI flows
  independent of character-card import.
- **Vietnamese interface support** across the story library, writing flow, Story
  Setup, Librarian, Agents, Help, Settings, TTS, Remote and supporting dialogs,
  while preserving user-authored content, provider/model identifiers, plugin
  metadata, prompts and machine values.
- **Windows source launcher, standalone binaries and Electron desktop packaging**
  with isolated application data, packaged server sidecar and cross-platform
  non-publishing release validation.
- **Curated desktop identity isolation** for v1.0: a dedicated application ID,
  dedicated user/session data namespace, and a distinct default Windows install
  path prevent collision with upstream/Viscerous desktop installs while keeping
  the visible product name `Errata`.

### Changed
- Generation and chat lifecycle ownership moved to the server while preserving the
  validated continuity, context, output-validation, logging, save and
  Librarian-trigger semantics.
- Runs are pinned to story branch/timeline identity so reconnect, replay, cancel
  and lost-POST recovery cannot attach across branches.
- OpenAI-compatible provider Base URLs are treated as explicit configuration;
  runtime no longer silently repairs an incorrect user endpoint by appending
  `/v1`.
- Story Setup structured updates are hardened against omitted/partial snapshots
  and buffered stream timing.
- Librarian analyze recovery handles an incomplete analysis-tool tail without
  changing the durable-run ownership model.
- Selected low-risk performance improvements retain active-branch caching,
  parallel Character Chat summary reads and lazy font-catalog loading without
  changing fragment persistence semantics.
- The source/build toolchain is reproducible: Bun `1.4.2`, Node
  `>=22.12.0`, Vite `7.3.6`, Nitro
  `3.0.1-20260821-003948-5e7235e6`, tracked `bun.lock` and frozen dependency
  installs.
- Desktop auto-update policy is stable-only by default: prerelease updates and
  version downgrades are disabled for the curated v1.x line.

### Fixed
- Disconnecting a browser/subscriber no longer stops an active model run; explicit
  Stop remains distinct and never commits partial generated prose.
- Lost generation POST retries reuse `clientRequestId` and attach to the existing
  server run instead of starting duplicate model work.
- Branch-resolution races no longer start or reattach runs before the active
  timeline is known.
- Settings overlay lifecycle fallback prevents the post-settings non-interactive
  "ghost overlay" state.
- Vietnamese IME composition is guarded across generation, refinement, inline
  editing, Story Wizard, Librarian/Character Chat and Fragment tag/ref Enter paths.
- Vietnamese Settings model-role labels/descriptions/inheritance presentation and
  the Remote tunnel accessibility label are localized without modifying server
  role identifiers or provider/model values.
- Source launchers no longer trust a stale dependency-ready stamp; dependency
  consistency is checked against the frozen lockfile.
- Legacy `run.bat` now reports a missing Bun runtime instead of closing after the
  initial check with no actionable explanation.
- Standalone binary packaging selects the correct executable form on Windows,
  Linux and macOS.

### Validation
The latest functional release-candidate checkpoint before P2.4 documentation and
whitespace-only closeout is `master-fix`
`0598aaa159290eefce122ca003b05067310267be`, tree
`5af5b559079de1a118b05281a0c7c9c727983235`.

- **P1.4 localization regression gate:** closed/pass after exact-head CI,
  post-merge tree equality and a full UI hard-code rescan with no actionable
  leakage remaining after classification.
- **P1.5 manual UX acceptance:** closed/pass after isolated runtime review of the
  major user surfaces, remediation of one major and one minor localization
  finding, exact-head CI, targeted runtime re-acceptance and post-merge tree
  equality.
- **P2.1 reproducible toolchain:** closed/pass after exact-head validation and
  expected-head merge into `master-fix`.
- **P2.2 full CI matrix on `0598aaa...`:** Vitest **215 files / 1,716 tests**,
  app + desktop typecheck, architecture boundaries, production build, Windows
  desktop smoke, standalone binary dry-runs and desktop installer dry-runs on
  Windows/Linux/macOS all passed.
- **P2.3 controlled performance comparison:** three alternating trials per side,
  30 measured iterations + 5 warmups per trial, correctness parity passed and no
  material regression was detected against frozen `master`
  `230b87878379ec0290b973fc3e747a63cbd3525b`.
- The package version remains `1.0.0`; the `v1.0.0` tag and GitHub Release
  remain intentionally uncreated until P2.4 is closed/pass and the Owner
  explicitly authorizes P3.
- After any future Owner-authorized merge to the default `master` branch, Vitest
  plus the `Test Results` workflow must pass on the merged state before
  `v1.0.0` is tagged or published.

## [1.12.0] — 2026-09-14

### Added
- **Inline passage editing.** Double-click any passage in the story view to
  edit it in place. The caret lands on the word you clicked, Ctrl/Cmd+Enter or
  clicking away saves a new version, and Esc discards the draft.
- **Interaction sounds** for panels and semantic actions, with hover cues kept
  silent.
- Per-story setting to expand generation thinking by default.
- Librarian prose transforms now include sticky context.

### Changed
- The passage action toolbar opens just above the click point instead of under
  the cursor, so a double-click always reaches the prose.
- Native `confirm()` dialogs are replaced with an in-app dialog, avoiding
  window focus loss on the desktop app.
- Story setup includes existing fragment context in its conversation.

### Fixed
- The librarian re-analyzes prose after LLM tool edits, reads fragments before
  editing them to prevent blind overwrites, skips analysis after disabled
  edits, and the analysis indicator refreshes after prose saves.
- Scrolling up during generation breaks free of autoscroll, and streaming
  thoughts stay pinned to the bottom as they overflow.
- Inline `<think>` reasoning is stripped from OpenAI-compatible streams.
- Number fields in settings accept typed input via draft-commit.
- File drop dialog actions stay pinned below the scroll area.
- Onboarding guilloche rotation no longer repaints the SVG every frame.

## [1.11.0] — 2026-07-18

### Added
- **Conversational story setup.** Writers can develop a premise, characters,
  scenes, and tone in an open-ended conversation while Errata tracks a live
  setup checklist and creates editable fragments as ideas take shape.
- **Native Google Gemini support** for generation, model discovery, and
  connection testing, including normalization of legacy Gemini endpoints.

### Changed
- Story setup now preserves its transcript, checklist, and fragment drafts
  across closes and reloads, and remains available from story settings.
- Polished the story library and writing controls with responsive layouts,
  better touch targets, clearer focus states, stronger contrast, reduced-motion
  support, and accessible control names.

### Fixed
- Story setup persists fragment progress throughout the conversation instead of
  waiting for a final step.
- Standalone release archives include the release version in their filenames.

## [1.10.0] — 2026-06-26

### Added
- **Share agent configs as erratapacks.** A new `agent-config` erratapack kind
  lets writers publish and install agent presets through erratanet, on a
  scripts-with-consent trust model. Adds a share dialog, import view, config
  selector, and `PackLink`; server-side bundle/pack builders, a preset store,
  and config routes. The pack schema mirrors the erratanet contract verbatim.
- **Prose image headers** with configurable aspect ratios and an edge fade.

### Changed
- **Hardened the generation pipeline** against data loss and races, tightened
  token-usage tracking, and stopped the prewriter from handing the writer a
  doubled brief.
- Removed the superseded model-specific instruction-override layer (registry
  defaults retained); per-agent blocks replace it.

## [1.9.0] — 2026-06-05

### Added
- **Summaries are now fragments.** Librarian summaries moved out of loose fields
  (`story.summary`, `analysis.summaryUpdate`, `fragment.meta._librarian.summary`)
  into a first-class `summary` fragment type (`sm-` prefix). Summaries are now
  editable, taggable, versionable, reorderable, and referenceable via
  `ctx.getFragment`.
  - Per-chapter summary fragments with overflow → era-summary compaction.
  - One-shot migration from `story.summary` on story load (idempotent).
  - `hiddenFromList` registry flag keeps summaries out of the fragment list by default.
- **Dedicated Summaries tab** with a fullscreen editor, plus a Summaries section
  in the librarian panel.
- **CodeMirror script editor** for context blocks — fullscreen view and `ctx`
  autocompletion (`ScriptEditor.tsx`, `ScriptEditor.completions.ts`).
- **Per-agent context config** export/import, with confirm-on-import for replacements.
- Prose: always-visible chapter-marker divider, jump-to-latest control in the
  outline sidebar, and a color picker for dialogue / narration / emphasis.
- New UI primitives: wizard, panel, file-drop dialog, async-state view, and
  semantic prose-text components.
- Agent activity wisps with rotating verbs and accessibility improvements.
- `.impeccable.md` design context and `.github/copilot-instructions.md`.

### Changed
- **Replaced the legacy Block Editor** with per-agent block configuration.
- Rewrote the new-story wizard on the new UI primitives.
- Reorganized generation controls and librarian analysis settings.
- Auto-resizing textareas for librarian and character chat input.
- Backend simplification sweep (PRs #22–#30): `withStory` route wrapper,
  inlined `createToolAgent` / writer agent / `renderBlock`, deduped
  capitalize/pluralize helpers, consolidated plugin-hook runners.

### Fixed
- Prevent context blocks leaking between the prewriter and writer agents.
- Handle `null` temperature in provider config.
- Pass writer temperature through to the model; apply writer prompt overrides.
- Register core agents before creating default blocks.
- Pass created fragment type to cache invalidation so the list updates on creation.
- Writer agent uses the writer-brief prompt in prewriter mode.

### Removed
- Legacy `BlockEditorPanel` and `BlockPreviewDialog`.
- `story.summary` writers and the `_librarian.summary` meta cache.
- Dead modules: `create-agent.ts`, `writer-agent.ts`, `blocks/storage.ts`.

### Notes
- `package.json` was never bumped for 1.8.0 (stayed at 1.7.0); corrected to 1.9.0 here.
- The `summary` fragment type bumps the fragment schema version. Migration runs on
  story load — verify against real `data/` stories before tagging.

## [1.8.0] — 2026-03-04

- Librarian: settings to disable directions/suggestions, dismiss suggestions,
  and delete analyses.

## [1.7.0] — 2026-02-20

## [1.6.0] — 2026-02-19
