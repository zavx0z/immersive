import type {JsxSourceRange} from "../contract/output.ts"

export type SourceRangeEdit = Readonly<{
  start: number
  end: number
  text: string
  /** Точные копии исходного текста; generated offsets отсчитываются от начала text. */
  copies?: readonly JsxSourceRange[]
}>

/** Отображает сохранённый текст и явные копии внутри замены; новый текст остаётся без координат. */
export function sourceRangesForEdits(length: number, edits: readonly SourceRangeEdit[]): readonly JsxSourceRange[] {
  const ranges: JsxSourceRange[] = []
  let source = 0
  let generated = 0
  for (const edit of [...edits].sort((left, right) => left.start - right.start || left.end - right.end)) {
    if (source < edit.start) ranges.push({generatedStart: generated, generatedEnd: generated + edit.start - source, sourceStart: source})
    generated += edit.start - source
    for (const copy of edit.copies ?? []) {
      ranges.push({generatedStart: generated + copy.generatedStart, generatedEnd: generated + copy.generatedEnd, sourceStart: copy.sourceStart})
    }
    generated += edit.text.length
    source = edit.end
  }
  if (source < length) ranges.push({generatedStart: generated, generatedEnd: generated + length - source, sourceStart: source})
  return Object.freeze(ranges.map(range => Object.freeze(range)))
}

/** Композиция двух последовательных преобразований без эвристического поиска текста. */
export function composeSourceRanges(next: readonly JsxSourceRange[], previous: readonly JsxSourceRange[]): readonly JsxSourceRange[] {
  const ranges: JsxSourceRange[] = []
  for (const outer of next) {
    const end = outer.sourceStart + outer.generatedEnd - outer.generatedStart
    for (const inner of previous) {
      const start = Math.max(outer.sourceStart, inner.generatedStart)
      const overlapEnd = Math.min(end, inner.generatedEnd)
      if (start >= overlapEnd) continue
      ranges.push({generatedStart: outer.generatedStart + start - outer.sourceStart, generatedEnd: outer.generatedStart + overlapEnd - outer.sourceStart, sourceStart: inner.sourceStart + start - inner.generatedStart})
    }
  }
  return Object.freeze(ranges.map(range => Object.freeze(range)))
}
