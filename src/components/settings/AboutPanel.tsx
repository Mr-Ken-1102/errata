/**
 * About section for Settings: interface language, wordmark, the real semantic version,
 * a short tagline, and outbound links (docs, Discord, GitHub, releases). Quiet and
 * typographic per the design language; no em dashes in user-facing copy.
 */
import { ExternalLink } from 'lucide-react'
import { useLanguage, type TranslationKey } from '@/lib/i18n'
import { SectionHeading, SettingsCard, SettingRow, SegmentedControl } from './primitives'

const LINKS: { labelKey: TranslationKey; href: string }[] = [
  { labelKey: 'settings.about.documentation', href: 'https://github.com/Viscerous/errata/tree/main/docs' },
  { labelKey: 'settings.about.discord', href: 'https://discord.gg/ywVFKvdH49' },
  { labelKey: 'settings.about.github', href: 'https://github.com/Viscerous/errata' },
  { labelKey: 'settings.about.releases', href: 'https://github.com/Viscerous/errata/releases' },
]

export function AboutSection() {
  const { language, setLanguage, t } = useLanguage()
  const languageOptions = [
    { value: 'en' as const, label: t('settings.language.english') },
    { value: 'vi' as const, label: t('settings.language.vietnamese') },
  ]

  return (
    <div className="space-y-6">
      <div>
        <SectionHeading label={t('settings.language.heading')} />
        <SettingsCard>
          <SettingRow
            label={t('settings.language.label')}
            description={t('settings.language.description')}
          >
            <SegmentedControl
              value={language}
              options={languageOptions}
              onChange={setLanguage}
            />
          </SettingRow>
        </SettingsCard>
      </div>

      <div>
        <SectionHeading label={t('settings.about.heading')} />
        <SettingsCard>
          <div className="flex items-baseline justify-between gap-3 px-3 py-3">
            <div className="min-w-0">
              <p className="font-display text-2xl italic leading-none tracking-tight text-foreground">
                {t('app.name')}
              </p>
              <p className="mt-1.5 text-[0.625rem] leading-snug text-muted-foreground">
                {t('settings.about.tagline')}
              </p>
            </div>
            <span className="shrink-0 font-mono text-[0.6875rem] tabular-nums text-muted-foreground">
              v{__APP_VERSION__}
            </span>
          </div>

          {LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between gap-3 px-3 py-2 text-[0.75rem] text-foreground/80 transition-colors hover:bg-accent/40 hover:text-foreground"
            >
              {t(link.labelKey)}
              <ExternalLink className="size-3 shrink-0 text-muted-foreground" />
            </a>
          ))}
        </SettingsCard>

        <p className="mt-2 text-center text-[0.625rem] leading-relaxed text-muted-foreground">
          {t('settings.about.builtBy')}{' '}
          <a
            href="https://github.com/nokusukun"
            target="_blank"
            rel="noopener noreferrer"
            className="underline transition-colors hover:text-foreground/70"
          >
            nokusukun
          </a>
          {' · '}GPL-2.0
        </p>
      </div>
    </div>
  )
}
