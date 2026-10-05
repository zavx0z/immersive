import type {CodeEditorVisualRow} from "./visual-rows.ts"

/** Полуоткрытое окно visual rows; offsets относятся к единственному исходнику. */
export type CodeEditorRowWindow = Readonly<{start: number; end: number}>
export type CodeEditorWindowBlock = Readonly<
  {kind: "row"; key: string; index: number; row: CodeEditorVisualRow} |
  {kind: "gap"; key: string; start: number; end: number; text: string}
>

/** Ограничивает объём материализации viewport и запасом; полностью скрытый viewport не рисует строки. */
export function codeEditorRowWindow(total: number, top: number, bottom: number, rowHeight: number, overscan = 8): CodeEditorRowWindow {
  if (rowHeight <= 0 || !Number.isFinite(rowHeight)) return {start: 0, end: Math.min(total, 32)}
  if (bottom <= top) return {start: 0, end: 0}
  return {
    start: Math.max(0, Math.min(total, Math.floor(top / rowHeight) - overscan)),
    end: Math.max(0, Math.min(total, Math.ceil(bottom / rowHeight) + overscan)),
  }
}

/** Ищет visual row по UTF-16 offset. На общей границе отдаёт предшествующую строку. */
export function codeEditorRowAtOffset(rows: readonly CodeEditorVisualRow[], offset: number): number {
  let low = 0
  let high = rows.length - 1
  while (low < high) {
    const middle = (low + high) >>> 1
    if (rows[middle]!.end < offset) low = middle + 1
    else high = middle
  }
  return low
}

/**
Полный DOM source в порядке документа: visible/pinned rows и скрытые сырые промежутки.
Закрепляются только endpoints, поэтому даже Select All не материализует весь документ.
*/
export function codeEditorWindowBlocks(
  rows: readonly CodeEditorVisualRow[], value: string, window: CodeEditorRowWindow, pinned: readonly number[] = [],
): readonly CodeEditorWindowBlock[] {
  const indices = new Set(pinned.filter(index => index >= 0 && index < rows.length))
  const start = Math.max(0, Math.min(rows.length, window.start))
  const end = Math.max(start, Math.min(rows.length, window.end))
  for (let index = start; index < end; index++) indices.add(index)
  const blocks: CodeEditorWindowBlock[] = []
  let previous = 0
  const gap = (end: number) => {
    if (end <= previous) return
    blocks.push({kind: "gap", key: `gap:${previous}`, start: previous, end,
      text: value.slice(rows[previous]!.start, end === rows.length ? value.length : rows[end]!.start)})
  }
  for (const index of [...indices].sort((left, right) => left - right)) {
    gap(index)
    const row = rows[index]!
    blocks.push({kind: "row", key: row.key, index, row})
    previous = index + 1
  }
  gap(rows.length)
  return blocks
}

/** Карта позиции при замене исходника: неизменные края сохраняют своё отношение к тексту. */
export function mapCodeEditorOffset(offset: number, previous: string, next: string): number {
  if (previous === next) return offset
  let start = 0
  while (start < previous.length && start < next.length && previous[start] === next[start]) start++
  let oldEnd = previous.length
  let newEnd = next.length
  while (oldEnd > start && newEnd > start && previous[oldEnd - 1] === next[newEnd - 1]) { oldEnd--; newEnd-- }
  return offset <= start ? offset : offset >= oldEnd ? offset + newEnd - oldEnd : newEnd
}
