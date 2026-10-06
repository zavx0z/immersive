import {Element, HTMLElement, type Document as SemanticDocument, type Event as SemanticEvent, type MouseEvent as SemanticMouseEvent} from "@zavx0z/immersive-dom"

/** Browser-owned default action semantic links; native Document служит только переходу/скачиванию. */
export function createDocumentNavigationHost(document: SemanticDocument, browserDocument: Document): Readonly<{dispose(): void}> {
  let disposed = false
  const activate = (event: SemanticEvent): void => {
    const mouse = event as SemanticMouseEvent
    if (mouse.button !== undefined && mouse.button !== 0) return
    let target = event.target instanceof Element ? event.target : null
    while (target && target.localName !== "a") target = target.parentElement
    if (!target || !target.hasAttribute("href")) return
    const anchor = target
    // Default action follows all semantic listeners, including document-level cancellation.
    queueMicrotask(() => {
      if (disposed || event.defaultPrevented || !anchor.isConnected) return
      const href = anchor.getAttribute("href") ?? ""
      if (!href) return
      let url: URL
      try {url = new URL(href, browserDocument.baseURI)} catch {return}
      if (!["http:", "https:", "mailto:", "tel:", "blob:"].includes(url.protocol)) return
      if (url.protocol === "blob:" && !anchor.hasAttribute("download")) return
      if (href.startsWith("#")) {
        let id: string
        try {id = decodeURIComponent(href.slice(1))} catch {return}
        const destination = document.getElementById(id)
        if (destination instanceof HTMLElement) {
          destination.scrollIntoView({block: "start"})
          return
        }
      }
      const native = browserDocument.createElement("a")
      native.href = url.href
      native.target = mouse.ctrlKey || mouse.metaKey || mouse.shiftKey ? "_blank" : anchor.getAttribute("target") ?? "_self"
      native.rel = `${anchor.getAttribute("rel") ?? ""} noopener`.trim()
      if (anchor.hasAttribute("download")) native.download = anchor.getAttribute("download") ?? ""
      native.hidden = true
      browserDocument.body.append(native)
      try {native.click()} finally {native.remove()}
    })
  }
  const keyboard = (event: SemanticEvent): void => {
    const key = event as SemanticEvent & {key?: string}
    if (key.key !== "Enter") return
    activate(event)
  }
  document.addEventListener("click", activate)
  document.addEventListener("keydown", keyboard)
  return {dispose() {
    disposed = true
    document.removeEventListener("click", activate)
    document.removeEventListener("keydown", keyboard)
  }}
}
