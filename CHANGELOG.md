# Changelog

All notable changes to Errata are documented here. Format loosely follows
[Keep a Changelog](https://keepachangelog.com/); versions are git tags.

## [1.0.0] — Unreleased

**Release identity:** **Errata v1.0** is the first curated release line of
`Mr-Ken-1102/errata`. It is based on upstream `tealios/errata` v1.12.0 (2026-09-14,
commit `610c7e7587fe334f0908dd2065f9be7c4761a0dc`) plus selectively integrated and
adapted work from audited Errata forks. See [`RELEASE_PROVENANCE.md`](RELEASE_PROVENANCE.md)
for the exact source repositories, source authors/maintainers, versions/branch snapshots,
commit SHAs, dates, integration method, rejected/reverted work, and upgrade-traceability rules.

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
- **Windows source launcher and Electron desktop packaging**, including an isolated
  source `DATA_DIR`, packaged server sidecar, GitHub update feed for this fork, and
  Windows smoke coverage that boots the bundled sidecar and checks `/api/health`.

### Changed
- Generation and chat lifecycle ownership moved to the server while preserving the
  existing Viscerous context, continuity, output-validation, logging, save, and
  Librarian-trigger semantics.
- Runs are pinned to story branch/timeline identity so reconnect, replay, cancel,
  and lost-POST recovery cannot attach across branches.
- Selected low-risk performance improvements add active-branch caching, parallel
  Character Chat summary reads, and lazy font-catalog loading without changing
  fragment persistence semantics.
- Release preparation now targets `Mr-Ken-1102/errata`, uses frozen dependency
  installs, validates release tag/version consistency, and keeps manual desktop
  workflow dispatches from publishing assets.

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
  editing, Story Wizard, Librarian/Character Chat, and Fragment tag/ref Enter paths.
- README and one-click Windows setup no longer redirect users to another Errata fork.

### Validation
- Standard CI: full Vitest suite, app + desktop typecheck, architecture boundaries,
  and production build passed on the validated integration tree and post-merge master.
- Windows desktop smoke passed twice on the same source tree as master, including
  `start.bat check`, Electron packaging, packaged sidecar verification, sidecar boot,
  and HTTP 200 from `/api/health`.

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
