import { mkdir, readdir, readFile, rm } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { writeJsonAtomic } from '../fs-utils'
import {
  StoryPresetMetaSchema,
  PRESET_FRAGMENT_TYPES,
  PRESET_LIMITS,
  PRESET_ID_REGEX,
  type StoryPresetMeta,
} from './schema'
import type { FragmentBundleData, FragmentExportEntry } from '@/lib/fragment-clipboard'

export class InvalidPresetError extends Error {}
export class InvalidPresetBundleError extends InvalidPresetError {}
export class InvalidPresetInputError extends InvalidPresetError {}

function presetsDir(dataDir: string): string {
  return join(dataDir, 'presets')
}

function presetDir(dataDir: string, presetId: string): string {
  return join(presetsDir(dataDir), presetId)
}

function presetMetaPath(dataDir: string, presetId: string): string {
  return join(presetDir(dataDir, presetId), 'meta.json')
}

function presetBundlePath(dataDir: string, presetId: string): string {
  return join(presetDir(dataDir, presetId), 'bundle.json')
}

function generatePresetId(dataDir: string): string {
  for (let attempt = 0; attempt < 20; attempt++) {
    const id = `preset-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`
    if (!existsSync(presetDir(dataDir, id))) return id
  }
  throw new Error('Failed to allocate a unique preset id')
}

async function readJson<T>(path: string): Promise<T | null> {
  if (!existsSync(path)) return null
  return JSON.parse(await readFile(path, 'utf-8')) as T
}

function parseMeta(value: unknown): StoryPresetMeta {
  const parsed = StoryPresetMetaSchema.safeParse(value)
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? 'Invalid preset metadata'
    throw new InvalidPresetInputError(message)
  }
  return parsed.data
}

function isAllowedType(type: string): boolean {
  return (PRESET_FRAGMENT_TYPES as readonly string[]).includes(type)
}

function stripTransportProvenance(entry: FragmentExportEntry): FragmentExportEntry {
  if (!entry.meta) return { ...entry }
  const meta = { ...entry.meta }
  delete meta.erratanet
  delete meta.preset
  return {
    ...entry,
    ...(Object.keys(meta).length > 0 ? { meta } : { meta: {} }),
  }
}

/**
 * Validate and normalize a preset payload before it is stored or applied.
 * Presets intentionally carry reusable story context only: no prose and no
 * block/agent configuration. Transport provenance is removed so applying a
 * preset cannot make local copies masquerade as their former source.
 */
export function sanitizePresetBundle(bundle: unknown): FragmentBundleData {
  const data = bundle as Partial<FragmentBundleData>
  if (
    data?._errata !== 'fragment-bundle'
    || data.version !== 1
    || typeof data.source !== 'string'
    || typeof data.exportedAt !== 'string'
    || !Array.isArray(data.fragments)
    || data.fragments.length === 0
  ) {
    throw new InvalidPresetBundleError('Invalid fragment bundle')
  }
  if (data.blockConfig || data.agentBlockConfigs) {
    throw new InvalidPresetBundleError('Refusing bundle: block configuration is not allowed in a preset')
  }
  if (data.fragments.length > PRESET_LIMITS.maxFragments) {
    throw new InvalidPresetBundleError(`Preset may not exceed ${PRESET_LIMITS.maxFragments} fragments`)
  }

  const incomingBytes = Buffer.byteLength(JSON.stringify(bundle), 'utf-8')
  if (incomingBytes > PRESET_LIMITS.maxBytes) {
    throw new InvalidPresetBundleError(
      `Preset payload exceeds ${Math.floor(PRESET_LIMITS.maxBytes / (1024 * 1024))} MiB`,
    )
  }

  const disallowed = new Set<string>()
  const bundledIds = new Set<string>()
  for (const entry of data.fragments) {
    if (
      !entry
      || typeof entry !== 'object'
      || typeof entry.type !== 'string'
      || typeof entry.name !== 'string'
      || typeof entry.content !== 'string'
    ) {
      throw new InvalidPresetBundleError('Invalid fragment bundle entry')
    }
    if (entry.id !== undefined) {
      if (typeof entry.id !== 'string' || !entry.id) {
        throw new InvalidPresetBundleError('Invalid preset fragment id')
      }
      if (bundledIds.has(entry.id)) {
        throw new InvalidPresetBundleError(`Duplicate preset fragment id: ${entry.id}`)
      }
      bundledIds.add(entry.id)
    }
    if (
      entry.refs !== undefined
      && (!Array.isArray(entry.refs) || entry.refs.some(ref => typeof ref !== 'string'))
    ) {
      throw new InvalidPresetBundleError('Invalid preset fragment refs')
    }
    if (!isAllowedType(entry.type)) disallowed.add(entry.type)
  }
  if (disallowed.size > 0) {
    throw new InvalidPresetBundleError(
      `Preset may only contain ${PRESET_FRAGMENT_TYPES.join('/')} fragments; found: ${[...disallowed].join(', ')}`,
    )
  }

  const fragments = data.fragments.map((entry) => {
    const stripped = stripTransportProvenance(entry)
    const refs = stripped.refs?.filter(ref => bundledIds.has(ref)) ?? []
    const meta = { ...(stripped.meta ?? {}) }

    // A reusable preset must be self-contained. These fields are meaningful
    // only when their target ships in the same preset; keeping source-story ids
    // would create dangling references in a newly seeded story.
    if (typeof meta.previousFragmentId === 'string' && !bundledIds.has(meta.previousFragmentId)) {
      delete meta.previousFragmentId
    }
    if (typeof meta.variationOf === 'string' && !bundledIds.has(meta.variationOf)) {
      delete meta.variationOf
    }

    return {
      ...stripped,
      ...(refs.length > 0 ? { refs } : { refs: undefined }),
      ...(Object.keys(meta).length > 0 ? { meta } : { meta: {} }),
    }
  })

  return {
    ...(data as FragmentBundleData),
    fragments,
  }
}

function countsByType(bundle: FragmentBundleData): Record<string, number> {
  const counts: Record<string, number> = {}
  for (const entry of bundle.fragments) counts[entry.type] = (counts[entry.type] ?? 0) + 1
  return counts
}

export async function listPresets(dataDir: string): Promise<StoryPresetMeta[]> {
  const dir = presetsDir(dataDir)
  if (!existsSync(dir)) return []

  const entries = await readdir(dir, { withFileTypes: true })
  const metas: StoryPresetMeta[] = []
  for (const entry of entries) {
    if (!entry.isDirectory()) continue
    try {
      const raw = await readJson<unknown>(presetMetaPath(dataDir, entry.name))
      if (raw) metas.push(parseMeta(raw))
    } catch {
      // One damaged preset must not make the whole library unusable.
    }
  }
  return metas.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export async function getPreset(
  dataDir: string,
  presetId: string,
): Promise<{ meta: StoryPresetMeta; bundle: FragmentBundleData } | null> {
  if (!PRESET_ID_REGEX.test(presetId)) return null
  const meta = await readJson<unknown>(presetMetaPath(dataDir, presetId))
  if (!meta) return null
  const bundle = await readJson<unknown>(presetBundlePath(dataDir, presetId))
  if (!bundle) return null
  return { meta: parseMeta(meta), bundle: sanitizePresetBundle(bundle) }
}

export interface CreatePresetInput {
  name: string
  description?: string
  sourceStoryName?: string
  bundle: unknown
}

export async function createPreset(dataDir: string, input: CreatePresetInput): Promise<StoryPresetMeta> {
  const bundle = sanitizePresetBundle(input.bundle)
  const now = new Date().toISOString()
  const id = generatePresetId(dataDir)
  const meta = parseMeta({
    id,
    name: input.name,
    description: input.description ?? '',
    sourceStoryName: input.sourceStoryName,
    fragmentCount: bundle.fragments.length,
    countsByType: countsByType(bundle),
    createdAt: now,
    updatedAt: now,
  })

  const dir = presetDir(dataDir, id)
  await mkdir(dir, { recursive: true })
  try {
    // Bundle first, metadata second: meta.json acts as the visible commit marker.
    await writeJsonAtomic(presetBundlePath(dataDir, id), bundle)
    await writeJsonAtomic(presetMetaPath(dataDir, id), meta)
  } catch (error) {
    await rm(dir, { recursive: true, force: true }).catch(() => {})
    throw error
  }
  return meta
}

export interface UpdatePresetMetaInput {
  name?: string
  description?: string
}

export async function updatePresetMeta(
  dataDir: string,
  presetId: string,
  patch: UpdatePresetMetaInput,
): Promise<StoryPresetMeta | null> {
  const existing = await getPreset(dataDir, presetId)
  if (!existing) return null
  const meta = parseMeta({
    ...existing.meta,
    ...(patch.name !== undefined ? { name: patch.name } : {}),
    ...(patch.description !== undefined ? { description: patch.description } : {}),
    updatedAt: new Date().toISOString(),
  })
  await writeJsonAtomic(presetMetaPath(dataDir, presetId), meta)
  return meta
}

export async function deletePreset(dataDir: string, presetId: string): Promise<boolean> {
  if (!PRESET_ID_REGEX.test(presetId)) return false
  const dir = presetDir(dataDir, presetId)
  if (!existsSync(dir)) return false
  await rm(dir, { recursive: true, force: true })
  return true
}
