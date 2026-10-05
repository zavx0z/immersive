import {
  DataTransfer as SemanticDataTransfer,
  releaseDataTransfer,
  sealDataTransfer,
  type Document,
  type Element as SemanticElement,
  type Node,
} from "@zavx0z/immersive-dom"
import {createDocumentDragController, type DocumentDragType} from "@zavx0z/immersive-renderer-html"

type DragHit = Readonly<{target: SemanticElement; x: number; y: number}>

/** Один native мост Experience; выбор цели и координат остаётся у общего input router. */
export function createDocumentNativeDragHost(options: Readonly<{
  canvas: HTMLCanvasElement
  document: Document
  pick(event: DragEvent): DragHit | null
  requestFrame(): void
}>): Readonly<{clear(root?: Node): void; dispose(): void}> {
  const controller = createDocumentDragController(options.document)
  let disposed = false

  const dispatch = (event: DragEvent): void => {
    if (disposed) return
    const native = event.dataTransfer ?? null
    const transfer = native === null ? null : new SemanticDataTransfer({
      types: Array.from(native.types),
      files: event.type === "drop" ? Array.from(native.files) : [],
      dropEffect: native.dropEffect,
      effectAllowed: native.effectAllowed,
    })
    if (transfer !== null) {
      if (event.type === "drop" && native !== null) {
        for (const type of native.types) {
          if (type !== "Files") transfer.setData(type, native.getData(type))
        }
      }
      sealDataTransfer(transfer)
    }
    try {
      const hit = event.type === "dragleave" ? null : options.pick(event)
      const consumed = controller.dispatch(event.type as DocumentDragType, hit?.target ?? null, {
        clientX: hit?.x ?? event.clientX,
        clientY: hit?.y ?? event.clientY,
        ctrlKey: event.ctrlKey,
        shiftKey: event.shiftKey,
        altKey: event.altKey,
        metaKey: event.metaKey,
        button: event.button,
        buttons: event.buttons,
        dataTransfer: transfer,
      })
      if (native !== null && transfer !== null) native.dropEffect = transfer.dropEffect
      if (consumed && event.cancelable) event.preventDefault()
      options.requestFrame()
    } finally {
      if (transfer !== null) releaseDataTransfer(transfer)
    }
  }

  for (const type of ["dragenter", "dragover", "dragleave", "drop"]) {
    options.canvas.addEventListener(type, dispatch as EventListener)
  }
  return Object.freeze({
    clear: controller.clear,
    dispose() {
      if (disposed) return
      disposed = true
      for (const type of ["dragenter", "dragover", "dragleave", "drop"]) {
        options.canvas.removeEventListener(type, dispatch as EventListener)
      }
      controller.dispose()
    },
  })
}
