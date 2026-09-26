import type { ReactNode } from 'react'

export function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="inline-flex items-center px-1.5 py-0.5 rounded border border-border/40 bg-muted/40 text-[0.625rem] font-mono font-medium text-foreground/60 leading-none">
      {children}
    </kbd>
  )
}

export function ToolCard({ name, description }: { name: string; description: string }) {
  return (
    <div className="rounded-md border border-border/25 bg-accent/15 px-3 py-2.5 mb-2 last:mb-0">
      <code className="text-[0.71875rem] font-mono font-medium text-primary/80">{name}</code>
      <p className="text-[0.71875rem] text-muted-foreground mt-0.5 leading-snug">{description}</p>
    </div>
  )
}

export function Tip({ children }: { children: ReactNode }) {
  return (
    <div className="border-l-2 border-primary/25 pl-3 py-1.5 my-2.5">
      <p className="text-[0.71875rem] text-foreground/55 leading-relaxed italic">{children}</p>
    </div>
  )
}

export function P({ children }: { children: ReactNode }) {
  return <p className="text-[0.78125rem] text-foreground/65 leading-relaxed mb-2.5 last:mb-0">{children}</p>
}

export function Mono({ children }: { children: ReactNode }) {
  return <code className="text-[0.6875rem] font-mono text-primary/70 bg-primary/5 px-1 py-0.5 rounded">{children}</code>
}
