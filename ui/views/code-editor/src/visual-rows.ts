import type {CodeEditorSegment} from "@ui-views-code-editor/view-model"
import type {CodeEditorViewModel} from "@ui-views-code-editor/view-model"

/** Визуальная строка сохраняет исходный номер, текст и диапазоны подсветки. */
export interface CodeEditorVisualRow {
  readonly key: string
  readonly line: number
  readonly continuation: boolean
  readonly separator: string
  readonly formatting: string
  readonly segments: readonly CodeEditorSegment[]
}

/**
Делит готовые строки по UTF-16 смещениям, не вставляя символы в исходный текст.
Мягкие переносы совпадающие с обычными разделителями не создают пустых строк.
*/
export function codeEditorVisualRows(view: CodeEditorViewModel, breaks: readonly number[] = [], showFormattingCharacters = true): readonly CodeEditorVisualRow[] {
  let previous = 0
  for (const offset of breaks) {
    if (!Number.isSafeInteger(offset) || offset <= previous || offset >= view.props.value.length) {
      throw new RangeError("CodeEditor softBreaks должны быть возрастающими UTF-16 смещениями внутри текста")
    }
    previous = offset
  }
  const rows: CodeEditorVisualRow[] = []
  let position = 0
  let next = 0
  for (const [line, text] of view.lines.entries()) {
    const boundaries = [0]
    while (next < breaks.length && breaks[next]! <= position + text.length) {
      const offset = breaks[next++]! - position
      if (offset > 0 && offset < text.length) boundaries.push(offset)
    }
    boundaries.push(text.length)
    const segments = view.segments[line] ?? []
    for (let index = 1; index < boundaries.length; index++) {
      const start = boundaries[index - 1]!
      const end = boundaries[index]!
      const formatting = !showFormattingCharacters && index < boundaries.length - 1 ? formattingSuffix(text, start, end) : ""
      const visibleEnd = end - formatting.length
      rows.push({
        key: index === 1 ? String(line) : `${line}:${start}`,
        line,
        continuation: index > 1,
        separator: index === 1 && line > 0 ? view.lineEndings[line - 1] ?? "" : "",
        formatting,
        segments: boundaries.length === 2 ? segments : Object.freeze(segments.flatMap(segment => {
          const left = Math.max(start, segment.start)
          const right = Math.min(visibleEnd, segment.end)
          return left >= right ? [] : [{...segment, key: `${segment.key}:${left}:${right}`,
            start: left, end: right, text: segment.text.slice(left - segment.start, right - segment.start)}]
        })),
      })
    }
    position += text.length + (view.lineEndings[line]?.length ?? 0)
  }
  return rows
}

/** Отличает escape переноса перед границей строки от буквального экранированного обратного слеша. */
function formattingSuffix(text: string, start: number, end: number): string {
  for (const marker of ["\\r\\n", "\\n", "\\r"]) {
    const offset = end - marker.length
    if (offset < start || text.slice(offset, end) !== marker) continue
    let escaped = false
    for (let index = offset - 1; index >= 0 && text[index] === "\\"; index--) escaped = !escaped
    if (!escaped) return marker
  }
  return ""
}
