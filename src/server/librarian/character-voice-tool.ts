import { tool } from 'ai'
import { z } from 'zod/v4'
import { getFragment, updateFragment } from '../fragments/storage'
import { isFragmentLocked } from '../fragments/protection'
import type { Fragment } from '../fragments/schema'

/**
 * Chat-only editor for author-owned character POV voice notes.
 *
 * Automatic librarian flows never receive this tool. The description is
 * deliberately strict as a second guard: use it only when the author
 * explicitly asks to define, change, or clear a character's voice.
 */
export function createSetCharacterVoiceTool(dataDir: string, storyId: string) {
  return tool({
    description:
      'Set or clear a character\'s POV voice notes. Use only when the author explicitly asks to define, change, or remove how that character narrates or speaks; never change voice as a side effect of routine edits, refinement, analysis, or optimization.',
    inputSchema: z.object({
      fragmentId: z.string().describe('Character fragment ID, for example ch-bakumo'),
      voice: z.string().describe(
        'Voice notes written by or for the author: diction, cadence, verbal habits, inner monologue, and perception style. Pass an empty string to remove the voice notes.',
      ),
    }),
    execute: async ({ fragmentId, voice }: { fragmentId: string; voice: string }) => {
      const existing = await getFragment(dataDir, storyId, fragmentId)
      if (!existing) return { ok: false, error: `Fragment not found: ${fragmentId}` }
      if (existing.type !== 'character') {
        return {
          ok: false,
          error: `Fragment ${fragmentId} is type "${existing.type}"; only character fragments have POV voice notes`,
        }
      }
      if (isFragmentLocked(existing)) {
        return { ok: false, error: 'Fragment is locked and cannot be modified by AI tools.' }
      }

      const meta: Record<string, unknown> = { ...existing.meta }
      if (voice.trim()) meta.voice = voice
      else delete meta.voice

      const updated: Fragment = {
        ...existing,
        meta,
        updatedAt: new Date().toISOString(),
      }
      await updateFragment(dataDir, storyId, updated)
      return {
        ok: true,
        fragmentId,
        voiceSet: Boolean(voice.trim()),
      }
    },
  })
}
