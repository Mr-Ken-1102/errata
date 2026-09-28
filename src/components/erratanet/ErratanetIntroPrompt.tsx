import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/lib/i18n'

export function ErratanetIntroPrompt() {
  const queryClient = useQueryClient()
  const { t } = useLanguage()
  const [dismissed, setDismissed] = useState(false)

  const { data: enetConfig } = useQuery({
    queryKey: ['erratanet-config'],
    queryFn: () => api.erratanet.getConfig(),
  })

  const mutation = useMutation({
    mutationFn: (data: { enabled?: boolean; introSeen?: boolean }) =>
      api.erratanet.setConfig(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['erratanet-config'] })
    },
  })

  const handleEnable = () => {
    setDismissed(true)
    mutation.mutate({ enabled: true, introSeen: true })
  }

  const handleNotNow = () => {
    setDismissed(true)
    mutation.mutate({ introSeen: true })
  }

  const open = !dismissed && enetConfig?.introSeen === false

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) handleNotNow()
      }}
    >
      <DialogContent
        showCloseButton={false}
        className="sm:max-w-md"
        data-component-id="erratanet-intro-prompt"
      >
        <DialogHeader>
          <DialogTitle className="font-display text-xl italic">{t('erratanet.intro.title')}</DialogTitle>
          <DialogDescription className="leading-relaxed">
            {t('erratanet.intro.description')}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="ghost" onClick={handleNotNow} disabled={mutation.isPending}>
            {t('erratanet.intro.notNow')}
          </Button>
          <Button onClick={handleEnable} disabled={mutation.isPending}>
            {t('erratanet.intro.enable')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}