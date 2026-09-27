import { asSchema } from 'ai'
import { describe, expect, it } from 'vitest'
import {
  normalizeStorySetupSnapshotInput,
  StorySetupAssessmentSchema,
  StorySetupSnapshotInputSchema,
  StorySetupSnapshotSchema,
} from '@/server/story-setup/schema'

function containsUnion(value: unknown): boolean {
  if (!value || typeof value !== 'object') return false
  if (Array.isArray(value)) return value.some(containsUnion)
  const record = value as Record<string, unknown>
  if ('anyOf' in record || 'oneOf' in record) return true
  return Object.values(record).some(containsUnion)
}

describe('story setup tool schemas', () => {
  it('keeps assessment input to the checklist Errata actually consumes', async () => {
    const schema = await asSchema(StorySetupAssessmentSchema).jsonSchema
    expect(schema.properties).toEqual(expect.objectContaining({ checklist: expect.any(Object) }))
    expect(Object.keys(schema.properties ?? {})).toEqual(['checklist'])
    expect(schema.required).toEqual(['checklist'])
    expect(containsUnion(schema)).toBe(false)
  })

  it('avoids nullable unions in the writable snapshot schemas', async () => {
    const canonicalSchema = await asSchema(StorySetupSnapshotSchema).jsonSchema
    expect(canonicalSchema.required).toEqual(['checklist', 'fragments'])
    expect(canonicalSchema.properties).toEqual(expect.objectContaining({ story: expect.any(Object) }))
    expect(containsUnion(canonicalSchema)).toBe(false)

    const inputSchema = await asSchema(StorySetupSnapshotInputSchema).jsonSchema
    expect(inputSchema.required).toEqual(['checklist', 'fragments'])
    expect(inputSchema.properties).toEqual(expect.objectContaining({ story: expect.any(Object) }))
    expect(containsUnion(inputSchema)).toBe(false)
  })

  it('normalizes observed setup aliases without weakening the canonical stored schema', () => {
    const checklist = [
      'starting-point',
      'premise',
      'characters',
      'goal',
      'setting',
      'voice',
      'opening',
    ].map(key => ({ key, status: 'partial' as const, note: 'Known so far.' }))

    const input = StorySetupSnapshotInputSchema.parse({
      checklist,
      fragments: [
        {
          key: 'core-premise',
          type: 'premise',
          name: 'Core Premise',
          content: 'A lighthouse keeper hears tomorrow\'s distress calls one night early.',
        },
        {
          key: 'storm-coast',
          type: 'setting',
          name: 'Storm Coast',
          description: 'A dangerous coast surrounding the lighthouse.',
          content: 'Black rocks and heavy surf isolate the lighthouse.',
        },
      ],
    })

    expect(StorySetupSnapshotSchema.safeParse(input).success).toBe(false)

    const normalized = normalizeStorySetupSnapshotInput(input)
    expect(normalized.fragments).toEqual([
      expect.objectContaining({
        key: 'core-premise',
        type: 'knowledge',
        description: 'Core Premise',
      }),
      expect.objectContaining({
        key: 'storm-coast',
        type: 'knowledge',
        description: 'A dangerous coast surrounding the lighthouse.',
      }),
    ])
    expect(StorySetupSnapshotSchema.safeParse(normalized).success).toBe(true)
  })

  it('requires the canonical checklist order and unique setup fragment keys', () => {
    const checklist = [
      'starting-point',
      'premise',
      'characters',
      'goal',
      'setting',
      'voice',
      'opening',
    ].map(key => ({ key, status: 'missing', note: '' }))

    expect(StorySetupAssessmentSchema.safeParse({ checklist }).success).toBe(true)
    expect(StorySetupAssessmentSchema.safeParse({ checklist: [...checklist].reverse() }).success).toBe(false)
    expect(StorySetupSnapshotSchema.safeParse({
      checklist,
      fragments: [
        { key: 'same', type: 'knowledge', name: 'One', description: 'One', content: 'One' },
        { key: 'same', type: 'knowledge', name: 'Two', description: 'Two', content: 'Two' },
      ],
    }).success).toBe(false)
  })
})
