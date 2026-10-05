import {DataTransfer} from "./data-transfer.ts"
import {MouseEvent, type MouseEventInit} from "./src/mouse-event.ts"

export type DragEventInit = MouseEventInit & Readonly<{dataTransfer?: DataTransfer | null}>

/** Semantic drag-событие распространяется по тому же Document, что pointer/clipboard. */
export class DragEvent extends MouseEvent {
  readonly dataTransfer: DataTransfer | null

  constructor(type: string, init: DragEventInit = {}) {
    super(type, init)
    if (init.dataTransfer != null && !(init.dataTransfer instanceof DataTransfer)) {
      throw new TypeError("dataTransfer must be a semantic DataTransfer")
    }
    this.dataTransfer = init.dataTransfer ?? null
  }
}
