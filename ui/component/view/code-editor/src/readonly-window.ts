import {HTMLElement as SemanticHTMLElement} from "@zavx0z/immersive-dom/html-element"
import {observeElementLayout, readElementLayoutRect} from "@zavx0z/immersive-dom/geometry"
import {textOffsetAtPosition, textPositionAtOffset} from "@zavx0z/immersive-dom/text-position"
import type {Node} from "@zavx0z/immersive-dom/node"
import type {Event} from "@zavx0z/immersive-dom/event"
import type {PointerEvent} from "@zavx0z/immersive-dom/pointer-event"
import type {CodeEditorVisualRow} from "./visual-rows.ts"
import {codeEditorRowAtOffset, codeEditorRowWindow, mapCodeEditorOffset} from "./window-plan.ts"
import type {CodeEditorRowWindow} from "./window-plan.ts"

type Boundary = Readonly<{node: Node; offset: number; source: number | null}>
type SavedSelection = Readonly<{anchor: Boundary; head: Boundary; value: string}>

/**
Внутренняя интеграция с проверенным semantic HTMLElement. Авторские refs остаются lib.dom.
Геометрия и нативный ввод принадлежат платформе; binding только выбирает строки.
*/
export function createReadonlyCodeWindow(
  authorCode: globalThis.HTMLElement, authorViewport: globalThis.HTMLElement,
  update: (window: CodeEditorRowWindow) => void,
  materializeSelection: () => void,
) {
  if (!(authorCode instanceof SemanticHTMLElement) || !(authorViewport instanceof SemanticHTMLElement)) {
    throw new TypeError("CodeEditor window requires semantic HTMLElement refs")
  }
  const code: SemanticHTMLElement = authorCode
  const viewport: SemanticHTMLElement = authorViewport
  const document = code.ownerDocument!
  let rows: readonly CodeEditorVisualRow[] = []
  let value = ""
  let initialized = false
  let rowHeight = 0
  let dragging: Readonly<{index: number; pointerId: number}> | null = null
  let saved: SavedSelection | null = null
  let disposed = false
  let widest: Readonly<{index: number; width: number}> | null = null

  const measure = () => {
    if (disposed) return
    const sample = code.querySelector("span[data-line-index]")
    const sampleRect = sample ? readElementLayoutRect(sample) : null
    const codeRect = readElementLayoutRect(code)
    if (!codeRect || !sampleRect || sampleRect.height <= 0) return
    rowHeight = sampleRect.height
    for (const content of code.querySelectorAll("[data-code-line-content]")) {
      const rect = readElementLayoutRect(content)
      const index = Number(content.parentElement?.getAttribute("data-code-row-index"))
      if (rect && Number.isSafeInteger(index) && (widest === null || rect.width > widest.width)) {
        widest = {index, width: rect.width}
      }
    }
    let top = codeRect.top
    let bottom = codeRect.bottom
    const rect = readElementLayoutRect(viewport)
    if (!rect || rect.height <= 0) return
    top = Math.max(top, rect.top)
    bottom = Math.min(bottom, rect.bottom)
    update(codeEditorRowWindow(rows.length, top - codeRect.top, bottom - codeRect.top, rowHeight))
  }

  const capture = (nextValue: string): readonly number[] => {
    const selection = document.getSelection()
    const boundary = (node: Node | null, offset: number): Boundary | null => node === null ? null
      : {node, offset, source: textOffsetAtPosition(code, node, offset)}
    const anchor = boundary(selection.anchorNode, selection.anchorOffset)
    const head = boundary(selection.focusNode, selection.focusOffset)
    saved = anchor && head && (anchor.source !== null || head.source !== null) ? {anchor, head, value} : null
    const pinned = dragging === null ? [] : [dragging.index]
    // При shrink старое окно может быть за концом; первая строка даёт CSS measurement до пересчёта.
    if (value !== nextValue) pinned.push(0)
    if (value === nextValue && widest !== null) pinned.push(widest.index)
    for (const item of [saved?.anchor, saved?.head]) {
      if (item?.source === null || item?.source === undefined) continue
      const offset = value === nextValue ? item.source : mapCodeEditorOffset(item.source, value, nextValue)
      pinned.push(codeEditorRowAtOffset(rows, offset))
    }
    return pinned
  }

  const restore = () => {
    const snapshot = saved
    saved = null
    if (!snapshot) return
    const position = (boundary: Boundary) => boundary.source === null ? boundary
      : textPositionAtOffset(code, mapCodeEditorOffset(boundary.source, snapshot.value, value))
    const anchor = position(snapshot.anchor)
    const head = position(snapshot.head)
    const selection = document.getSelection()
    if (selection.anchorNode !== anchor.node || selection.anchorOffset !== anchor.offset ||
      selection.focusNode !== head.node || selection.focusOffset !== head.offset) {
      selection.setBaseAndExtent(anchor.node, anchor.offset, head.node, head.offset)
    }
  }

  const down = (event: Event) => {
    const pointer = event as PointerEvent
    if (pointer.button !== 0) return
    const target = event.target
    if (!(target instanceof SemanticHTMLElement)) return
    const row = target.closest("span[data-code-row-index]")
    if (row && code.contains(row)) dragging = {index: Number(row.getAttribute("data-code-row-index")), pointerId: pointer.pointerId}
    const selection = document.getSelection()
    const anchor = selection.anchorNode
    const sourceOffset = anchor ? textOffsetAtPosition(code, anchor, selection.anchorOffset) : null
    if (rows.length > 200 && sourceOffset !== null && !anchor?.parentElement?.closest("span[data-code-row-index]")) {
      // Renderer читает Shift anchor после pointerdown dispatch. До этого связываем gap offset с живой строкой.
      materializeSelection()
    }
  }
  const up = (event: Event) => {
    if ((event as PointerEvent).pointerId === dragging?.pointerId) dragging = null
  }
  // Строка остаётся смонтированной, пока Renderer удерживает нативный drag anchor.
  code.addEventListener("pointerdown", down)
  document.addEventListener("pointerup", up, true)
  document.addEventListener("pointercancel", up, true)
  document.addEventListener("scroll", measure, true)
  const releases = [observeElementLayout(code, measure), observeElementLayout(viewport, measure)]

  return {
    prepare(nextRows: readonly CodeEditorVisualRow[], nextValue: string) {
      if (!initialized) { value = nextValue; initialized = true }
      rows = nextRows
      return capture(nextValue)
    },
    commit(nextValue: string) {
      if (value !== nextValue) widest = null
      value = nextValue
      restore()
      measure()
    },
    scrollToLine(line: number, block: "start" | "center" | "end" | "nearest") {
      const index = rows.findIndex(row => row.line === line && !row.continuation)
      const codeRect = readElementLayoutRect(code)
      if (index < 0 || !codeRect || rowHeight <= 0) return false
      const owner = viewport
      const ownerRect = readElementLayoutRect(owner)
      if (!ownerRect) return false
      const top = codeRect.top + index * rowHeight
      const bottom = top + rowHeight
      const target = block === "center" ? top - (ownerRect.height - rowHeight) / 2
        : block === "end" ? bottom - ownerRect.height
          : block === "nearest" ? top < ownerRect.top ? top : bottom > ownerRect.bottom ? bottom - ownerRect.height : ownerRect.top
            : top
      owner.scrollTop += target - ownerRect.top
      measure()
      return true
    },
    dispose() {
      disposed = true
      for (const release of releases) release()
      code.removeEventListener("pointerdown", down)
      document.removeEventListener("pointerup", up, true)
      document.removeEventListener("pointercancel", up, true)
      document.removeEventListener("scroll", measure, true)
    },
  }
}

export type ReadonlyCodeWindow = ReturnType<typeof createReadonlyCodeWindow>
