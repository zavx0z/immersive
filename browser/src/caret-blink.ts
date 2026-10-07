import {HTMLInputElement, type Document, type Node} from "@zavx0z/immersive-dom"

/** Один таймер demand-кадра для активного однострочного поля Experience. */
export function createDocumentCaretBlink(options: Readonly<{
  document: Document
  owns(node: Node): boolean
  requestFrame(target: HTMLInputElement): void
  setTimer(callback: () => void, delayMs: number): unknown
  clearTimer(handle: unknown): void
}>) {
  let target: HTMLInputElement | null = null
  let value = ""
  let offset = 0
  let visible = true
  let timer: unknown | null = null
  let disposed = false
  const cancel = () => {
    if (timer !== null) options.clearTimer(timer)
    timer = null
  }
  const activeTarget = () => {
    const active = options.document.activeElement
    return active instanceof HTMLInputElement && active.isConnected && options.owns(active) &&
      !active.disabled && !active.readOnly && active.selectionStart !== null && active.selectionStart === active.selectionEnd
      ? active : null
  }
  const schedule = () => {
    timer = options.setTimer(() => {
      timer = null
      if (disposed) return
      const active = activeTarget()
      if (active !== target || active === null || active.value !== value || active.selectionStart !== offset) {
        synchronize()
        return
      }
      visible = !visible
      options.requestFrame(active)
      schedule()
    }, 500)
  }
  const synchronize = () => {
    if (disposed) return
    const active = activeTarget()
    if (active === target && (active === null || active.value === value && active.selectionStart === offset)) return
    cancel()
    target = active
    value = active?.value ?? ""
    offset = active?.selectionStart ?? 0
    visible = true
    if (active !== null) schedule()
  }
  const unsubscribeStates = options.document.subscribeStateChanges(synchronize)
  const unsubscribeMutations = options.document.subscribeMutations(synchronize)
  return {
    get visible() {return visible},
    synchronize,
    dispose() {
      if (disposed) return
      disposed = true
      cancel()
      unsubscribeStates()
      unsubscribeMutations()
      target = null
    },
  }
}
