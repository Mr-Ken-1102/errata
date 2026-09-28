import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { X, Code2, RotateCcw, Save } from 'lucide-react'
import { Hint } from '@/components/ui/prose-text'
import {
  Panel,
  PanelActions,
  PanelBody,
  PanelHeader,
  PanelHeaderText,
  PanelTitle,
} from '@/components/ui/panel'
import { useCustomCss } from '@/lib/theme'
import { useLanguage } from '@/lib/i18n'

interface CustomCssPanelProps {
  onClose: () => void
}

export function CustomCssPanel({ onClose }: CustomCssPanelProps) {
  const { t } = useLanguage()
  const [savedCss, , setCss] = useCustomCss()
  const [value, setValue] = useState(savedCss)

  useEffect(() => {
    setValue(savedCss)
  }, [savedCss])

  const handleSave = useCallback(() => {
    setCss(value)
    onClose()
  }, [value, setCss, onClose])

  const handleReset = useCallback(() => {
    setValue('')
  }, [])

  return (
    <Panel data-component-id="custom-css-panel-root">
      <PanelHeader>
        <PanelHeaderText className="flex-row items-center gap-2">
          <Code2 className="size-4 text-muted-foreground" />
          <PanelTitle>{t('settings.customCss.title')}</PanelTitle>
          <span className="text-[0.625rem] text-muted-foreground uppercase tracking-wider">{t('settings.customCss.appearance')}</span>
        </PanelHeaderText>
        <PanelActions>
          <Button size="icon" variant="ghost" className="size-7 text-muted-foreground" onClick={onClose} data-component-id="custom-css-panel-close">
            <X className="size-4" />
          </Button>
        </PanelActions>
      </PanelHeader>

      <PanelBody className="px-6 py-6" data-component-id="custom-css-panel-scroll">
        <div className="max-w-3xl w-full mx-auto space-y-4">
          <Hint className="text-[0.625rem] leading-snug">
            {t('settings.customCss.description')}
          </Hint>

          <Textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={t('settings.customCss.editorPlaceholder')}
            className="min-h-[60vh] font-mono text-sm resize-none"
            spellCheck={false}
            data-component-id="custom-css-panel-editor"
          />

          <div className="flex items-center justify-between gap-2">
            <Button variant="outline" size="sm" onClick={handleReset} disabled={!value} data-component-id="custom-css-panel-clear">
              <RotateCcw className="size-3.5 mr-1.5" />
              {t('settings.customCss.clear')}
            </Button>

            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={onClose} data-component-id="custom-css-panel-cancel">
                {t('settings.customCss.cancel')}
              </Button>
              <Button size="sm" onClick={handleSave} data-component-id="custom-css-panel-save">
                <Save className="size-3.5 mr-1.5" />
                {t('settings.customCss.save')}
              </Button>
            </div>
          </div>
        </div>
      </PanelBody>
    </Panel>
  )
}

// Component to apply custom CSS to the document
const CUSTOM_CSS_STYLE_ID = 'errata-custom-css'

export function CustomCssStyles({ css, enabled }: { css: string; enabled: boolean }) {
  useEffect(() => {
    let styleEl = document.getElementById(CUSTOM_CSS_STYLE_ID) as HTMLStyleElement | null
    
    if (enabled && css) {
      if (!styleEl) {
        styleEl = document.createElement('style')
        styleEl.id = CUSTOM_CSS_STYLE_ID
        document.head.appendChild(styleEl)
      }
      styleEl.textContent = css
    } else {
      if (styleEl) {
        styleEl.remove()
      }
    }
    
    return () => {
      const el = document.getElementById(CUSTOM_CSS_STYLE_ID)
      if (el) {
        el.remove()
      }
    }
  }, [css, enabled])
  
  return null
}