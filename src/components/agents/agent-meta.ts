import { BookOpen, MessageSquare, Sparkles, Compass, Wand2, Bot, Layers3 } from 'lucide-react'
import type { TranslationKey } from '@/lib/i18n'

// Shared display metadata for agents, used by both the floating activity wisp and
// the activity panel's status strip so they describe agents the same way.

export interface AgentMeta {
  label: string
  /** A single present-continuous verb for compact status (e.g. the panel strip). */
  status: string
  /** Rotating list of verbs the wisp cycles through while active. */
  actions: string[]
  color: string
  glow: string
  icon: typeof Bot
}

export const AGENT_META: Record<string, AgentMeta> = {
  'librarian.analyze': {
    label: 'Librarian',
    status: 'Analyzing',
    actions: ['Reading', 'Annotating', 'Cross-referencing', 'Noting details'],
    color: 'oklch(0.78 0.15 70)',
    glow: 'oklch(0.78 0.15 70 / 35%)',
    icon: BookOpen,
  },
  'librarian.rollup': {
    label: 'Memory',
    status: 'Consolidating',
    actions: ['Consolidating memory', 'Folding older passages', 'Building the story record'],
    color: 'oklch(0.72 0.12 215)',
    glow: 'oklch(0.72 0.12 215 / 35%)',
    icon: Layers3,
  },
  'librarian.refine': {
    label: 'Librarian',
    status: 'Refining',
    actions: ['Refining', 'Polishing', 'Tightening a line', 'Re-phrasing'],
    color: 'oklch(0.72 0.13 50)',
    glow: 'oklch(0.72 0.13 50 / 35%)',
    icon: Wand2,
  },
  'librarian.chat': {
    label: 'Librarian',
    status: 'Replying',
    actions: ['Listening', 'Considering', 'Composing a reply'],
    color: 'oklch(0.70 0.10 80)',
    glow: 'oklch(0.70 0.10 80 / 35%)',
    icon: MessageSquare,
  },
  'librarian.optimize-character': {
    label: 'Librarian',
    status: 'Optimizing',
    actions: ['Sharpening', 'Consolidating', 'Clarifying'],
    color: 'oklch(0.75 0.13 60)',
    glow: 'oklch(0.75 0.13 60 / 35%)',
    icon: Sparkles,
  },
  'librarian.prose-transform': {
    label: 'Librarian',
    status: 'Transforming',
    actions: ['Transforming', 'Rewriting', 'Re-voicing'],
    color: 'oklch(0.70 0.12 135)',
    glow: 'oklch(0.70 0.12 135 / 35%)',
    icon: Wand2,
  },
  'character-chat.chat': {
    label: 'Character',
    status: 'Replying',
    actions: ['Listening', 'Considering', 'Reaching for words'],
    color: 'oklch(0.68 0.14 175)',
    glow: 'oklch(0.68 0.14 175 / 35%)',
    icon: MessageSquare,
  },
  'directions.suggest': {
    label: 'Directions',
    status: 'Suggesting',
    actions: ['Plotting a path', 'Weighing options', 'Peering ahead'],
    color: 'oklch(0.72 0.11 290)',
    glow: 'oklch(0.72 0.11 290 / 35%)',
    icon: Compass,
  },
  'generation.writer': {
    label: 'Writer',
    status: 'Writing',
    actions: ['Writing', 'Finding the next line', 'Listening to the page', 'Setting the scene'],
    color: 'oklch(0.74 0.12 25)',
    glow: 'oklch(0.74 0.12 25 / 35%)',
    icon: Sparkles,
  },
  'generation.prewriter': {
    label: 'Prewriter',
    status: 'Planning',
    actions: ['Planning', 'Outlining the scene', 'Shaping the brief'],
    color: 'oklch(0.72 0.11 320)',
    glow: 'oklch(0.72 0.11 320 / 35%)',
    icon: Compass,
  },
  'story-setup.chat': {
    label: 'Story Setup',
    status: 'Planning',
    actions: ['Planning', 'Shaping the premise', 'Preparing starter fragments'],
    color: 'oklch(0.72 0.10 250)',
    glow: 'oklch(0.72 0.10 250 / 35%)',
    icon: Sparkles,
  },
}

const AGENT_META_I18N: Record<string, {
  label: TranslationKey
  status: TranslationKey
  actions: TranslationKey[]
}> = {
  'librarian.analyze': {
    label: 'agentMeta.label.librarian',
    status: 'agentMeta.status.analyzing',
    actions: ['agentMeta.action.reading', 'agentMeta.action.annotating', 'agentMeta.action.crossReferencing', 'agentMeta.action.notingDetails'],
  },
  'librarian.rollup': {
    label: 'agentMeta.label.memory',
    status: 'agentMeta.status.consolidating',
    actions: ['agentMeta.action.consolidatingMemory', 'agentMeta.action.foldingPassages', 'agentMeta.action.buildingStoryRecord'],
  },
  'librarian.refine': {
    label: 'agentMeta.label.librarian',
    status: 'agentMeta.status.refining',
    actions: ['agentMeta.action.refining', 'agentMeta.action.polishing', 'agentMeta.action.tighteningLine', 'agentMeta.action.rephrasing'],
  },
  'librarian.chat': {
    label: 'agentMeta.label.librarian',
    status: 'agentMeta.status.replying',
    actions: ['agentMeta.action.listening', 'agentMeta.action.considering', 'agentMeta.action.composingReply'],
  },
  'librarian.optimize-character': {
    label: 'agentMeta.label.librarian',
    status: 'agentMeta.status.optimizing',
    actions: ['agentMeta.action.sharpening', 'agentMeta.action.consolidating', 'agentMeta.action.clarifying'],
  },
  'librarian.prose-transform': {
    label: 'agentMeta.label.librarian',
    status: 'agentMeta.status.transforming',
    actions: ['agentMeta.action.transforming', 'agentMeta.action.rewriting', 'agentMeta.action.revoicing'],
  },
  'character-chat.chat': {
    label: 'agentMeta.label.character',
    status: 'agentMeta.status.replying',
    actions: ['agentMeta.action.listening', 'agentMeta.action.considering', 'agentMeta.action.reachingForWords'],
  },
  'directions.suggest': {
    label: 'agentMeta.label.directions',
    status: 'agentMeta.status.suggesting',
    actions: ['agentMeta.action.plottingPath', 'agentMeta.action.weighingOptions', 'agentMeta.action.peeringAhead'],
  },
  'generation.writer': {
    label: 'agentMeta.label.writer',
    status: 'agentMeta.status.writing',
    actions: ['agentMeta.action.writing', 'agentMeta.action.findingNextLine', 'agentMeta.action.listeningToPage', 'agentMeta.action.settingScene'],
  },
  'generation.prewriter': {
    label: 'agentMeta.label.prewriter',
    status: 'agentMeta.status.planning',
    actions: ['agentMeta.action.planning', 'agentMeta.action.outliningScene', 'agentMeta.action.shapingBrief'],
  },
  'story-setup.chat': {
    label: 'agentMeta.label.storySetup',
    status: 'agentMeta.status.planning',
    actions: ['agentMeta.action.planning', 'agentMeta.action.shapingPremise', 'agentMeta.action.preparingStarterFragments'],
  },
}

export const DEFAULT_META: AgentMeta = {
  label: 'Agent',
  status: 'Working',
  actions: ['Working'],
  color: 'oklch(0.65 0.08 240)',
  glow: 'oklch(0.65 0.08 240 / 35%)',
  icon: Bot,
}

function titleCase(s: string): string {
  return s.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

export function getAgentMeta(agentName: string): AgentMeta {
  if (AGENT_META[agentName]) return AGENT_META[agentName]

  // Derive a readable label/status from the agent name (e.g. "librarian.summarize").
  const parts = agentName.split('.')
  const label = titleCase(parts[0])
  const status = parts[1] ? titleCase(parts[1]) : 'Working'
  return { ...DEFAULT_META, label, status, actions: [status] }
}

export function getLocalizedAgentMeta(
  agentName: string,
  t: (key: TranslationKey) => string,
): AgentMeta {
  const meta = getAgentMeta(agentName)
  const keys = AGENT_META_I18N[agentName]
  if (!keys) return meta
  return {
    ...meta,
    label: t(keys.label),
    status: t(keys.status),
    actions: keys.actions.map((key) => t(key)),
  }
}
