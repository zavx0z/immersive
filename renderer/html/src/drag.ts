import {DragEvent, type Document, type Element, type Node, type DragEventInit} from "@zavx0z/immersive-dom"

export type DocumentDragType = "dragenter" | "dragover" | "dragleave" | "drop"
export type DocumentDragController = Readonly<{
  target: Element | null
  dispatch(type: DocumentDragType, target: Element | null, input: DragEventInit): boolean
  clear(root?: Node): void
  dispose(): void
}>

/**
 * Один drag lifecycle документа поверх уже выбранного projection hit.
 * Не удерживает DataTransfer; смена проекции того же Element сохраняет цель.
 * Возвращает true, когда semantic обработчик отменил native default.
 */
export function createDocumentDragController(document: Document): DocumentDragController {
  let target: Element | null = null
  let point: DragEventInit = {}
  let disposed = false

  const send = (type: DocumentDragType, node: Element, input: DragEventInit, relatedTarget: Element | null): boolean =>
    !node.dispatchEvent(new DragEvent(type, {
      ...input,
      relatedTarget,
      bubbles: true,
      cancelable: type !== "dragleave",
      composed: true,
    }))

  const clear = (root?: Node): void => {
    if (target === null || root !== undefined && !root.contains(target)) return
    const previous = target
    target = null
    send("dragleave", previous, point, null)
  }

  return Object.freeze({
    get target() { return target },
    dispatch(type, next, input) {
      if (disposed) return false
      point = {clientX: input.clientX ?? 0, clientY: input.clientY ?? 0}
      if (type === "dragleave") {
        const previous = target
        target = null
        if (previous !== null) send(type, previous, input, null)
        return false
      }
      if (next?.ownerDocument !== document || !next.isConnected) next = null
      let consumed = false
      if (next !== target) {
        const previous = target
        target = next
        if (previous !== null) send("dragleave", previous, input, next)
        if (next !== null) consumed = send("dragenter", next, input, previous)
      }
      if (next === null) return false
      if (type === "dragover") consumed = send(type, next, input, null) || consumed
      if (type === "drop") {
        target = null
        consumed = send(type, next, input, null)
      }
      return consumed
    },
    clear,
    dispose() {
      if (disposed) return
      disposed = true
      clear()
      point = {}
    },
  })
}
