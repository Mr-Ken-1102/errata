import { z } from 'zod/v4'

/** Built-in context fragment types a story preset can safely seed into any story. */
export const PRESET_FRAGMENT_TYPES = ['character', 'guideline', 'knowledge'] as const
export type PresetFragmentType = (typeof PRESET_FRAGMENT_TYPES)[number]

export const PRESET_LIMITS = {
  maxFragments: 500,
  maxBytes: 32 * 1024 * 1024,
  maxNameLength: 80,
  maxDescriptionLength: 250,
  maxSourceStoryNameLength: 200,
} as const

export const PRESET_ID_REGEX = /^preset-[a-z0-9]+$/

export const StoryPresetMetaSchema = z.object({
  id: z.string().regex(PRESET_ID_REGEX),
  name: z.string().trim().min(1).max(PRESET_LIMITS.maxNameLength),
  description: z.string().trim().max(PRESET_LIMITS.maxDescriptionLength).default(''),
  sourceStoryName: z.string().trim().max(PRESET_LIMITS.maxSourceStoryNameLength).optional(),
  fragmentCount: z.int().min(0).default(0),
  countsByType: z.record(z.string(), z.int().min(0)).default({}),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
})

export type StoryPresetMeta = z.infer<typeof StoryPresetMetaSchema>
