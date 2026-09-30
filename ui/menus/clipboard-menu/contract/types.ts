

/** Structural command port: UI has no Browser dependency or native clipboard access. */
export type ClipboardMenuController = Readonly<{
  getSnapshot(): Readonly<{
    open: boolean
    x: number
    y: number
    canCopy: boolean
    canPaste: boolean
    pending: boolean
    error: string | null
  }>
  subscribe(listener: () => void): () => void
  copy(): Promise<unknown>
  paste(): Promise<unknown>
  close(): void
}>
