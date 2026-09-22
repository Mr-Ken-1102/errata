import { describe, expect, it } from 'vitest'
import {
  buildLorebookItems,
  isSillyTavernLorebook,
  parseCardJson,
  parseSillyTavernLorebook,
} from '@/lib/importers/tavern-card'

describe('standalone SillyTavern lorebook import', () => {
  it('parses array-based entries and preserves import metadata', () => {
    const text = JSON.stringify({
      name: 'World Notes',
      entries: [
        {
          id: 7,
          keys: ['empire', 'capital'],
          secondary_keys: ['throne'],
          content: 'The capital is built around the old throne complex.',
          comment: 'Capital',
          enabled: true,
          constant: false,
          selective: true,
          insertion_order: 42,
          priority: 9,
          position: 'after_char',
        },
      ],
    })

    const parsed = parseSillyTavernLorebook(text)
    expect(parsed).not.toBeNull()
    expect(parsed!.book.name).toBe('World Notes')
    expect(parsed!.book.entries).toHaveLength(1)
    expect(parsed!.items).toHaveLength(1)
    expect(parsed!.items[0]).toMatchObject({
      key: 'lorebook-7',
      suggestedType: 'knowledge',
      name: 'Capital',
      tags: ['empire', 'capital'],
      sticky: false,
      placement: 'user',
      enabled: true,
      meta: {
        importSource: 'tavern-lorebook',
        lorebookName: 'World Notes',
        lorebookEntryId: 7,
        insertionOrder: 42,
        priority: 9,
        selective: true,
        secondaryKeys: ['throne'],
        constant: false,
        position: 'after_char',
      },
    })
  })

  it('accepts object-with-numeric-keys entries used by standalone world-info exports', () => {
    const text = JSON.stringify({
      name: 'Rules',
      entries: {
        '0': {
          id: 0,
          keys: ['style'],
          content: 'Always narrate in close third person.',
          enabled: true,
          constant: true,
          position: 'before_char',
        },
        '1': {
          id: 1,
          keys: ['district'],
          content: 'The harbor district floods at spring tide.',
          enabled: false,
        },
      },
    })

    const parsed = parseSillyTavernLorebook(text)
    expect(parsed?.items).toHaveLength(2)
    expect(parsed?.items[0]).toMatchObject({
      suggestedType: 'guideline',
      sticky: true,
      placement: 'system',
      enabled: true,
    })
    expect(parsed?.items[1]).toMatchObject({
      suggestedType: 'knowledge',
      sticky: false,
      placement: 'user',
      enabled: false,
    })
    expect(isSillyTavernLorebook(text)).toBe(true)
  })

  it('rejects malformed, empty, character-card, and Errata export payloads', () => {
    expect(parseSillyTavernLorebook('{oops')).toBeNull()
    expect(parseSillyTavernLorebook(JSON.stringify({ name: 'Empty', entries: [] }))).toBeNull()

    const card = JSON.stringify({
      spec: 'chara_card_v2',
      spec_version: '2.0',
      data: {
        name: 'Ari',
        description: 'Character',
        character_book: {
          name: 'Embedded',
          entries: [{ id: 1, keys: ['x'], content: 'Embedded lore.' }],
        },
      },
    })
    expect(parseCardJson(card)).not.toBeNull()
    expect(parseSillyTavernLorebook(card)).toBeNull()

    const errata = JSON.stringify({
      _errata: 'fragment-bundle',
      version: 1,
      entries: [{ content: 'not a lorebook' }],
    })
    expect(parseSillyTavernLorebook(errata)).toBeNull()
  })

  it('buildLorebookItems creates deterministic order and type inference', () => {
    const items = buildLorebookItems({
      name: 'Mixed',
      entries: [
        {
          id: 'a',
          keys: ['rule'],
          secondaryKeys: [],
          content: 'Do not break POV.',
          comment: '',
          name: 'POV rule',
          enabled: true,
          constant: true,
          selective: false,
          insertionOrder: 0,
          position: '',
          priority: 0,
        },
        {
          id: 'b',
          keys: ['place'],
          secondaryKeys: [],
          content: 'Old mill by the river.',
          comment: '',
          name: 'Old Mill',
          enabled: true,
          constant: false,
          selective: false,
          insertionOrder: 0,
          position: '',
          priority: 0,
        },
      ],
    })

    expect(items.map(item => item.order)).toEqual([0, 1])
    expect(items.map(item => item.suggestedType)).toEqual(['guideline', 'knowledge'])
  })
})
