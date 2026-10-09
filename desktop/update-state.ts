import type { UpdateInfo } from 'builder-util-runtime'

/** Fail closed: a failed story backup must never start desktop installation. */
export type InstallUpdateResult =
  | { ok: true }
  | { ok: false; stage: 'backup' | 'install'; reason: string }

export async function installAfterBackup(
  backup: () => Promise<void>,
  install: () => void,
): Promise<InstallUpdateResult> {
  try {
    await backup()
  } catch (err) {
    return { ok: false, stage: 'backup', reason: err instanceof Error ? err.message : String(err) }
  }

  try {
    install()
  } catch (err) {
    return { ok: false, stage: 'install', reason: err instanceof Error ? err.message : String(err) }
  }

  return { ok: true }
}

export type UpdateStatus =
  | 'idle'
  | 'checking'
  | 'available'
  | 'downloading'
  | 'downloaded'
  | 'skipped'
  | 'not-available'
  | 'error'

export interface UpdateState {
  status: UpdateStatus
  version?: string
  releaseName?: string
  releaseDate?: string
  releaseNotes?: string
  percent?: number
  error?: string
}

type ReleaseNotes = UpdateInfo['releaseNotes']

export function normalizeReleaseNotes(notes: ReleaseNotes): string | undefined {
  if (typeof notes === 'string') {
    const trimmed = notes.trim()
    return trimmed || undefined
  }

  if (!Array.isArray(notes)) return undefined

  const entries = notes
    .map((entry) => {
      const note = entry.note?.trim()
      if (!note) return ''
      return [`Version ${entry.version}`, note].join('\n')
    })
    .filter(Boolean)

  return entries.length > 0 ? entries.join('\n\n') : undefined
}

export function updateMetadata(info: UpdateInfo): Pick<UpdateState, 'version' | 'releaseName' | 'releaseDate' | 'releaseNotes'> {
  return {
    version: info.version,
    releaseName: info.releaseName?.trim() || undefined,
    releaseDate: info.releaseDate,
    releaseNotes: normalizeReleaseNotes(info.releaseNotes),
  }
}
