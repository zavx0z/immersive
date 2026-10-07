import type {Document} from "./document.ts"
import type {Element} from "./element.ts"
import {Event} from "./event.ts"

export type FullscreenOptions = Readonly<{navigationUI?: "auto" | "hide" | "show"}>

/** Browser owns native permission and the Canvas; DOM owns the selected element. */
export type DocumentFullscreenHost = Readonly<{
  enabled(): boolean
  request(element: Element, options?: FullscreenOptions): Promise<void>
  exit(): Promise<void>
}>

type State = {
  host: DocumentFullscreenHost | null
  element: Element | null
  pending: boolean
  pendingElement: Element | null
  serial: number
  subscribers: Set<() => void>
}
const states = new WeakMap<Document, State>()
const stateFor = (document: Document): State => {
  let state = states.get(document)
  if (!state) {
    state = {host: null, element: null, pending: false, pendingElement: null, serial: 0, subscribers: new Set()}
    states.set(document, state)
  }
  return state
}

export const readDocumentFullscreenElement = (document: Document): Element | null => states.get(document)?.element ?? null
export const readDocumentFullscreenEnabled = (document: Document): boolean => states.get(document)?.host?.enabled() ?? false

function publish(document: Document, state: State, element: Element | null): void {
  const previous = state.element
  if (previous === element) return
  state.element = element
  for (const subscriber of [...state.subscribers]) subscriber()
  const target = element ?? previous
  ;(target?.isConnected ? target : document).dispatchEvent(new Event("fullscreenchange", {bubbles: true}))
}

/** Cancels pending entry as well as an active target when native Esc/exit occurs. */
export function clearDocumentFullscreen(document: Document): void {
  const state = stateFor(document)
  state.serial++
  state.pending = false
  state.pendingElement = null
  publish(document, state, null)
}

export function subscribeDocumentFullscreen(document: Document, subscriber: () => void): () => void {
  const state = stateFor(document)
  state.subscribers.add(subscriber)
  return () => {state.subscribers.delete(subscriber)}
}

export function bindDocumentFullscreenHost(document: Document, host: DocumentFullscreenHost): () => void {
  const state = stateFor(document)
  if (state.host) throw new Error("Document already has a fullscreen host")
  state.host = host
  const unsubscribe = document.subscribeMutations(() => {
    if (state.element && !state.element.isConnected || state.pendingElement && !state.pendingElement.isConnected) {
      void exitDocumentFullscreen(document).catch(() => clearDocumentFullscreen(document))
    }
  })
  return () => {
    if (state.host !== host) return
    unsubscribe()
    const active = state.element !== null || state.pending
    state.host = null
    clearDocumentFullscreen(document)
    if (active) void host.exit().catch(() => {})
  }
}

export async function requestElementFullscreen(element: Element, options?: FullscreenOptions): Promise<void> {
  const document = element.ownerDocument
  if (!document || !element.isConnected) throw new TypeError("Fullscreen element must be connected to its Document")
  const state = stateFor(document)
  const host = state.host
  if (!host || !host.enabled()) throw new DOMException("Fullscreen is unavailable in this host", "NotSupportedError")
  const serial = ++state.serial
  const previous = state.element
  state.pending = true
  state.pendingElement = element
  try {
    // No deferred task before the native call: retain the user's activation.
    await host.request(element, options)
    if (state.serial !== serial || state.host !== host || !element.isConnected) {
      if (state.element === null && state.pendingElement === null) await host.exit()
      throw new DOMException("Fullscreen request was superseded or detached", "AbortError")
    }
    state.pending = false
    state.pendingElement = null
    publish(document, state, element)
  } catch (error) {
    if (state.serial === serial) {
      state.pending = false
      state.pendingElement = null
      if (state.element === element && previous !== element) {
        try {await host.exit()} finally {publish(document, state, null)}
      }
    }
    ;(element.isConnected ? element : document).dispatchEvent(new Event("fullscreenerror", {bubbles: true}))
    throw error
  }
}

export async function exitDocumentFullscreen(document: Document): Promise<void> {
  const state = stateFor(document)
  if (!state.element && !state.pending) return
  const serial = ++state.serial
  state.pending = false
  state.pendingElement = null
  await state.host?.exit()
  if (state.serial === serial) publish(document, state, null)
}
