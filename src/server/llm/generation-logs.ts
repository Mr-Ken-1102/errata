import { mkdir, readdir } from 'node:fs/promises'
import { join } from 'node:path'
import { getContentRoot } from '../fragments/branches'
import { readJsonFile, writeJsonAtomic, withStorageLock } from '../fs-utils'
import type { SamplingSettings } from '../fragments/schema'

export interface ToolCallLog {
  toolName: string
  args: Record<string, unknown>
  result: unknown
}

export interface TokenUsage {
  inputTokens: number
  outputTokens: number
}

export interface GenerationLog {
  id: string
  createdAt: string
  input: string
  messages: Array<{ role: string; content: string }>
  toolCalls: ToolCallLog[]
  generatedText: string
  fragmentId: string | null
  model: string
  sampling?: SamplingSettings
  durationMs: number
  stepCount: number
  finishReason: string
  stepsExceeded: boolean
  commitStatus?: 'committed' | 'rejected'
  rejectionCode?: 'empty_output' | 'incomplete_finish' | 'reasoning_leak'
  rejectionReason?: string
  totalUsage?: TokenUsage
  reasoning?: string
  prewriterBrief?: string
  prewriterReasoning?: string
  prewriterMessages?: Array<{ role: string; content: string }>
  prewriterDurationMs?: number
  prewriterModel?: string
  prewriterSampling?: SamplingSettings
  prewriterUsage?: TokenUsage
  prewriterToolCalls?: ToolCallLog[]
  prewriterDirections?: Array<{ pacing: string; title: string; description: string; instruction: string }>
}

export interface GenerationLogSummary {
  id: string
  createdAt: string
  input: string
  fragmentId: string | null
  model: string
  sampling?: SamplingSettings
  durationMs: number
  toolCallCount: number
  stepCount: number
  stepsExceeded: boolean
}

const INDEX_FILENAME = '_index.json'
const INDEX_VERSION = 1

interface GenerationLogIndex {
  version: typeof INDEX_VERSION
  summaries: GenerationLogSummary[]
}

async function logsDir(dataDir: string, storyId: string): Promise<string> {
  const root = await getContentRoot(dataDir, storyId)
  return join(root, 'generation-logs')
}

function indexPath(dir: string): string {
  return join(dir, INDEX_FILENAME)
}

function logPathInDir(dir: string, logId: string): string {
  return join(dir, `${logId}.json`)
}

async function logPath(dataDir: string, storyId: string, logId: string): Promise<string> {
  const dir = await logsDir(dataDir, storyId)
  return logPathInDir(dir, logId)
}

function toSummary(log: GenerationLog): GenerationLogSummary {
  return {
    id: log.id,
    createdAt: log.createdAt,
    input: log.input,
    fragmentId: log.fragmentId,
    model: log.model,
    sampling: log.sampling,
    durationMs: log.durationMs,
    toolCallCount: log.toolCalls.length,
    stepCount: log.stepCount ?? 1,
    stepsExceeded: log.stepsExceeded ?? false,
  }
}

function sortSummaries(summaries: GenerationLogSummary[]): GenerationLogSummary[] {
  return summaries.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

async function listLogIds(dir: string): Promise<string[]> {
  let entries: string[]
  try {
    entries = await readdir(dir)
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return []
    throw error
  }

  return entries
    .filter(entry => entry.endsWith('.json') && entry !== INDEX_FILENAME)
    .map(entry => entry.slice(0, -'.json'.length))
}

function isIndex(value: unknown): value is GenerationLogIndex {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Partial<GenerationLogIndex>
  return candidate.version === INDEX_VERSION && Array.isArray(candidate.summaries)
}

/**
 * Reconcile the derived summary index with the authoritative log files.
 *
 * A save writes the full log first and the index second. If the process exits
 * between those operations, the next list/find notices the extra file and
 * repairs the index rather than permanently hiding the completed generation.
 */
async function reconcileIndexUnlocked(dir: string): Promise<GenerationLogSummary[]> {
  const ids = await listLogIds(dir)
  if (ids.length === 0) return []

  let parsed: unknown
  try {
    parsed = await readJsonFile<unknown>(indexPath(dir))
  } catch {
    // The index is derived data. A corrupt index is rebuilt from authoritative
    // generation logs instead of blocking access to those logs.
    parsed = undefined
  }

  const fileIds = new Set(ids)
  const indexed = isIndex(parsed)
    ? parsed.summaries.filter(summary => (
        typeof summary?.id === 'string' && fileIds.has(summary.id)
      ))
    : []
  const indexedIds = new Set(indexed.map(summary => summary.id))
  const missingIds = ids.filter(id => !indexedIds.has(id))

  if (missingIds.length === 0 && indexed.length === ids.length && isIndex(parsed)) {
    return sortSummaries([...indexed])
  }

  const missingLogs = await Promise.all(
    missingIds.map(id => readJsonFile<GenerationLog>(logPathInDir(dir, id))),
  )
  const summaries = [
    ...indexed,
    ...missingLogs
      .filter((log): log is GenerationLog => log !== undefined)
      .map(toSummary),
  ]
  sortSummaries(summaries)

  await writeJsonAtomic(indexPath(dir), {
    version: INDEX_VERSION,
    summaries,
  } satisfies GenerationLogIndex)
  return summaries
}

async function getGenerationLogIndex(dir: string): Promise<GenerationLogSummary[]> {
  return withStorageLock(indexPath(dir), () => reconcileIndexUnlocked(dir))
}

export async function saveGenerationLog(
  dataDir: string,
  storyId: string,
  log: GenerationLog,
): Promise<void> {
  const dir = await logsDir(dataDir, storyId)
  await mkdir(dir, { recursive: true })

  // Full log is authoritative and lands first.
  await writeJsonAtomic(logPathInDir(dir, log.id), log)

  // Reconcile under one lock so concurrent generations cannot lose each
  // other's index entries. Reconciliation also covers crash-recovery gaps.
  await withStorageLock(indexPath(dir), async () => {
    const current = await reconcileIndexUnlocked(dir)
    const next = current.filter(summary => summary.id !== log.id)
    next.push(toSummary(log))
    sortSummaries(next)
    await writeJsonAtomic(indexPath(dir), {
      version: INDEX_VERSION,
      summaries: next,
    } satisfies GenerationLogIndex)
  })
}

export async function getGenerationLog(
  dataDir: string,
  storyId: string,
  logId: string,
): Promise<GenerationLog | null> {
  return (await readJsonFile<GenerationLog>(await logPath(dataDir, storyId, logId))) ?? null
}

export async function listGenerationLogs(
  dataDir: string,
  storyId: string,
): Promise<GenerationLogSummary[]> {
  const dir = await logsDir(dataDir, storyId)
  return getGenerationLogIndex(dir)
}

/**
 * Find the most recent generation log produced for a given fragment.
 *
 * The summary index turns this from an O(number of logs) full-JSON scan into
 * one lightweight index read plus one full log read.
 */
export async function findGenerationLogByFragment(
  dataDir: string,
  storyId: string,
  fragmentId: string,
): Promise<GenerationLog | null> {
  const dir = await logsDir(dataDir, storyId)
  const summaries = await getGenerationLogIndex(dir)
  const match = summaries.find(summary => summary.fragmentId === fragmentId)
  if (!match) return null
  return (await readJsonFile<GenerationLog>(logPathInDir(dir, match.id))) ?? null
}
