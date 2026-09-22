import { Elysia, t } from 'elysia'
import {
  listPresets,
  getPreset,
  createPreset,
  updatePresetMeta,
  deletePreset,
  InvalidPresetError,
} from '../presets/storage'
import { getStory } from '../fragments/storage'
import { withBranch } from '../fragments/branches'
import { installFragmentBundle } from '../erratanet/pack-install'
import { createLogger } from '../logging'
import { PRESET_LIMITS } from '../presets/schema'

export function presetRoutes(dataDir: string) {
  const logger = createLogger('api:presets', { dataDir })

  return new Elysia({ detail: { tags: ['Presets'] } })
    .get('/presets', async () => ({ presets: await listPresets(dataDir) }), {
      detail: { summary: 'List story presets' },
    })

    .get('/presets/:presetId', async ({ params, set }) => {
      const preset = await getPreset(dataDir, params.presetId)
      if (!preset) {
        set.status = 404
        return { error: 'Preset not found' }
      }
      return preset
    }, { detail: { summary: 'Get a preset and its fragment bundle' } })

    .post('/presets', async ({ body, set }) => {
      try {
        return await createPreset(dataDir, {
          name: body.name,
          description: body.description,
          sourceStoryName: body.sourceStoryName,
          bundle: body.bundle,
        })
      } catch (error) {
        if (error instanceof InvalidPresetError) {
          set.status = 422
          return { error: error.message }
        }
        logger.error('Failed to create preset', { error: error instanceof Error ? error.message : String(error) })
        throw error
      }
    }, {
      detail: { summary: 'Save a fragment bundle as a named story preset' },
      body: t.Object({
        name: t.String({ minLength: 1, maxLength: PRESET_LIMITS.maxNameLength }),
        description: t.Optional(t.String({ maxLength: PRESET_LIMITS.maxDescriptionLength })),
        sourceStoryName: t.Optional(t.String({ maxLength: PRESET_LIMITS.maxSourceStoryNameLength })),
        bundle: t.Record(t.String(), t.Unknown()),
      }),
    })

    .patch('/presets/:presetId', async ({ params, body, set }) => {
      try {
        const meta = await updatePresetMeta(dataDir, params.presetId, body)
        if (!meta) {
          set.status = 404
          return { error: 'Preset not found' }
        }
        return meta
      } catch (error) {
        if (error instanceof InvalidPresetError) {
          set.status = 422
          return { error: error.message }
        }
        throw error
      }
    }, {
      detail: { summary: 'Rename or redescribe a story preset' },
      body: t.Object({
        name: t.Optional(t.String({ minLength: 1, maxLength: PRESET_LIMITS.maxNameLength })),
        description: t.Optional(t.String({ maxLength: PRESET_LIMITS.maxDescriptionLength })),
      }),
    })

    .delete('/presets/:presetId', async ({ params, set }) => {
      const ok = await deletePreset(dataDir, params.presetId)
      if (!ok) {
        set.status = 404
        return { error: 'Preset not found' }
      }
      return { ok: true }
    }, { detail: { summary: 'Delete a story preset' } })

    .post('/presets/:presetId/apply', async ({ params, body, set }) => {
      const preset = await getPreset(dataDir, params.presetId)
      if (!preset) {
        set.status = 404
        return { error: 'Preset not found' }
      }
      const story = await getStory(dataDir, body.storyId)
      if (!story) {
        set.status = 404
        return { error: 'Story not found' }
      }

      const fragments = await withBranch(
        dataDir,
        body.storyId,
        () => installFragmentBundle(dataDir, body.storyId, preset.bundle, {
          pack: preset.meta.id,
          version: '0.0.0',
          kind: 'preset',
          presetName: preset.meta.name,
        }),
      )
      return { fragments, count: fragments.length }
    }, {
      detail: { summary: 'Apply a story preset by copying fresh fragments' },
      body: t.Object({ storyId: t.String() }),
    })
}
