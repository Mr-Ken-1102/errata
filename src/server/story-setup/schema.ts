import { z } from 'zod/v4'

const STORY_SETUP_CHECKLIST_KEYS = [
  'starting-point',
  'premise',
  'characters',
  'goal',
  'setting',
  'voice',
  'opening',
] as const

export const StorySetupChecklistKeySchema = z.enum(STORY_SETUP_CHECKLIST_KEYS)

export const StorySetupChecklistItemSchema = z.object({
  key: StorySetupChecklistKeySchema,
  status: z.enum(['missing', 'partial', 'covered']),
  note: z.string().max(120),
})

export const StorySetupDraftFragmentSchema = z.object({
  key: z.string().min(1).max(50).regex(/^[a-z0-9][a-z0-9-]*$/),
  type: z.enum(['guideline', 'knowledge', 'character', 'prose']),
  name: z.string().trim().min(1).max(100),
  description: z.string().trim().min(1).max(250),
  content: z.string().trim().min(1),
})

// Model-facing input accepts the two semantic labels local models have
// repeatedly used for knowledge fragments. Persisted fragments remain canonical.
const STORY_SETUP_INPUT_FRAGMENT_TYPES = [
  'guideline',
  'knowledge',
  'character',
  'prose',
  'premise',
  'setting',
] as const

const StorySetupDraftFragmentInputSchema = z.object({
  key: z.string().min(1).max(50).regex(/^[a-z0-9][a-z0-9-]*$/),
  type: z.enum(STORY_SETUP_INPUT_FRAGMENT_TYPES),
  name: z.string().trim().min(1).max(100),
  description: z.string().trim().min(1).max(250).optional(),
  content: z.string().trim().min(1),
})

const StorySetupChecklistSchema = z.array(StorySetupChecklistItemSchema).length(7).superRefine((items, ctx) => {
  items.forEach((item, index) => {
    const expected = STORY_SETUP_CHECKLIST_KEYS[index]
    if (item.key !== expected) {
      ctx.addIssue({
        code: 'custom',
        path: [index, 'key'],
        message: `Expected checklist key ${expected}`,
      })
    }
  })
})

export const StorySetupAssessmentSchema = z.object({
  checklist: StorySetupChecklistSchema,
})

export const StorySetupSnapshotSchema = z.object({
  story: z.object({
    name: z.string().trim().min(1).max(100),
    description: z.string().trim().max(500),
  }).optional(),
  checklist: StorySetupChecklistSchema,
  fragments: z.array(StorySetupDraftFragmentSchema).max(12).superRefine((fragments, ctx) => {
    const seen = new Set<string>()
    fragments.forEach((fragment, index) => {
      if (seen.has(fragment.key)) {
        ctx.addIssue({
          code: 'custom',
          path: [index, 'key'],
          message: `Duplicate story setup key ${fragment.key}`,
        })
      }
      seen.add(fragment.key)
    })
  }),
})

export const StorySetupSnapshotInputSchema = z.object({
  story: z.object({
    name: z.string().trim().min(1).max(100).optional(),
    description: z.string().trim().max(500).optional(),
  }).optional(),
  checklist: StorySetupChecklistSchema,
  fragments: z.array(StorySetupDraftFragmentInputSchema).max(12).superRefine((fragments, ctx) => {
    const seen = new Set<string>()
    fragments.forEach((fragment, index) => {
      if (seen.has(fragment.key)) {
        ctx.addIssue({
          code: 'custom',
          path: [index, 'key'],
          message: `Duplicate story setup key ${fragment.key}`,
        })
      }
      seen.add(fragment.key)
    })
  }),
})

type StorySetupInputFragmentType = typeof STORY_SETUP_INPUT_FRAGMENT_TYPES[number]

function normalizeStorySetupFragmentType(
  type: StorySetupInputFragmentType,
): z.infer<typeof StorySetupDraftFragmentSchema>['type'] {
  if (type === 'premise' || type === 'setting') return 'knowledge'
  return type
}

export function normalizeStorySetupSnapshotInput(
  input: z.infer<typeof StorySetupSnapshotInputSchema>,
  currentStory: { name: string; description: string },
): z.infer<typeof StorySetupSnapshotSchema> {
  return StorySetupSnapshotSchema.parse({
    ...input,
    story: input.story ? {
      name: input.story.name?.trim() || currentStory.name.trim(),
      description: input.story.description?.trim() ?? currentStory.description.trim(),
    } : undefined,
    fragments: input.fragments.map(fragment => ({
      ...fragment,
      type: normalizeStorySetupFragmentType(fragment.type),
      description: fragment.description?.trim() || fragment.name.trim(),
    })),
  })
}

export type StorySetupDraftFragment = z.infer<typeof StorySetupDraftFragmentSchema>
