import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const source = readFileSync('src/components/onboarding/OnboardingWizard.tsx', 'utf8')

function section(start: string, end: string): string {
  const startIndex = source.indexOf(start)
  const endIndex = source.indexOf(end, startIndex + start.length)
  expect(startIndex).toBeGreaterThanOrEqual(0)
  expect(endIndex).toBeGreaterThan(startIndex)
  return source.slice(startIndex, endIndex)
}

describe('Onboarding layout regression', () => {
  it('shows welcome and provider choices together instead of staggering individual options', () => {
    const welcome = section('function WelcomeStep(', 'function ProviderSelectStep(')
    const providers = section('function ProviderSelectStep(', 'function ProviderSetupStep(')

    expect(welcome).not.toContain('animationDelay')
    expect(welcome).not.toContain('animate-onboarding-fade-up')
    expect(providers).not.toContain('animationDelay')
    expect(providers).not.toContain('animate-onboarding-fade-up')
    expect(providers).toContain('{cards.map(([key, card]) => {')

    // The whole step may still fade in as one unit.
    expect(source).toContain('<Wizard.Step stepKey="welcome" transition="fade">')
    expect(source).toContain('<Wizard.Step stepKey="provider-select" transition="fade">')
  })

  it('top-aligns the tall typography step so header and footer remain reachable at 100% zoom', () => {
    expect(source).toContain(
      '<div className="flex items-start justify-center min-h-full py-8 sm:py-10">',
    )
    expect(source).toContain('<div className="w-full max-w-xl mx-auto px-6">')
    expect(source).toContain('<div className="relative z-10 h-full overflow-auto">')
  })
})
