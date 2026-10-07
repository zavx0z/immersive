import {
  bindDocumentFullscreenHost,
  clearDocumentFullscreen,
  type Document,
  type Element,
  type Event as SemanticEvent,
} from "@zavx0z/immersive-dom"

/** Native fullscreen belongs to the existing Canvas, never to a second video/DOM tree. */
export function createDocumentFullscreenHost(options: Readonly<{
  document: Document
  canvas: HTMLCanvasElement
  validate(element: Element): void
}>) {
  const nativeDocument = options.canvas.ownerDocument
  let disposed = false
  const release = bindDocumentFullscreenHost(options.document, {
    enabled: () => !disposed && nativeDocument?.fullscreenEnabled !== false
      && typeof options.canvas.requestFullscreen === "function" && typeof nativeDocument?.exitFullscreen === "function",
    async request(element, fullscreenOptions) {
      options.validate(element)
      if (nativeDocument.fullscreenElement !== options.canvas) await options.canvas.requestFullscreen(fullscreenOptions)
      if (disposed || nativeDocument.fullscreenElement !== options.canvas) {
        if (disposed && nativeDocument.fullscreenElement === options.canvas) await nativeDocument.exitFullscreen()
        throw new DOMException("Native fullscreen did not remain active", "AbortError")
      }
    },
    async exit() {
      if (nativeDocument?.fullscreenElement === options.canvas) await nativeDocument.exitFullscreen()
    },
  })
  const changed = () => {
    if (!disposed && nativeDocument.fullscreenElement !== options.canvas) clearDocumentFullscreen(options.document)
  }
  const escape = (event: SemanticEvent) => {
    if (!options.document.fullscreenElement || !("key" in event) || event.key !== "Escape") return
    event.preventDefault()
    event.stopPropagation()
    void options.document.exitFullscreen().catch(() => {})
  }
  nativeDocument?.addEventListener("fullscreenchange", changed)
  options.document.addEventListener("keydown", escape, {capture: true})
  return {dispose() {
    if (disposed) return
    disposed = true
    nativeDocument?.removeEventListener("fullscreenchange", changed)
    options.document.removeEventListener("keydown", escape, {capture: true})
    release()
  }}
}
