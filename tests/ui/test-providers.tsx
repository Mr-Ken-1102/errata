import React, { type ReactNode } from 'react'
import { LanguageProvider } from '@/lib/i18n'

export function withLanguageProvider(child: ReactNode) {
  return React.createElement(LanguageProvider, null, child)
}
