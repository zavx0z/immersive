import {HTMLElement as SemanticHTMLElement} from "@zavx0z/immersive-dom/html-element"
import {Range} from "@zavx0z/immersive-dom/range"
import {textOffsetAtPosition} from "@zavx0z/immersive-dom/text-position"

/**
Внутренняя граница терминала с semantic DOM. Читает пересечение общего выделения
с выводом в смещениях UTF-16, сохраняя направление и исходный Document Range.
Авторский ref проверяется по runtime-владельцу без приведения браузерных типов
к типам реализации. Пустое или внешнее выделение не образует снимка терминала.
*/
export function readTerminalSelectionOffsets(
  element: globalThis.HTMLElement,
  length: number,
): Readonly<{anchor: number; focus: number}> | null {
  if (!(element instanceof SemanticHTMLElement)) throw new TypeError("Terminal requires its semantic HTMLElement")
  const root: SemanticHTMLElement = element
  const document = root.ownerDocument!
  const selection = document.getSelection()
  if (selection.isCollapsed || !selection.anchorNode || !selection.focusNode || selection.rangeCount === 0) return null
  const range = selection.getRangeAt(0)
  if (!range.intersectsNode(root)) return null
  const contents = document.createRange()
  contents.selectNodeContents(root)
  const start = range.compareBoundaryPoints(Range.START_TO_START, contents) < 0 ? 0
    : textOffsetAtPosition(root, range.startContainer, range.startOffset) ?? 0
  const end = range.compareBoundaryPoints(Range.END_TO_END, contents) > 0 ? length
    : textOffsetAtPosition(root, range.endContainer, range.endOffset) ?? length
  if (start === end) return null
  return selection.direction === "backward" ? {anchor: end, focus: start} : {anchor: start, focus: end}
}
