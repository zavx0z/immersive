import type {RenderOverflowWrap, RenderWhiteSpace} from "./types"

export type InlineInput<Owner> = Readonly<{
  owner: Owner
  kind: "text" | "box" | "break"
  text: string
  whiteSpace: RenderWhiteSpace
  overflowWrap?: RenderOverflowWrap | undefined
  width: number
  height: number
  baseline?: number
}>

export type InlineFragment<Owner> = Readonly<{
  owner: Owner
  kind: "text" | "box" | "break"
  text: string
  /** Исходная граница DOM UTF-16 для каждой границы выведенного текста. */
  sourceOffsets: readonly number[]
  x: number
  y: number
  width: number
  height: number
  line: number
}>

export type InlinePlan<Owner> = Readonly<{
  width: number
  height: number
  fragments: readonly InlineFragment<Owner>[]
}>

type Piece<Owner> = {input: InlineInput<Owner>; text: string; width: number; sourceOffsets: number[]}
type Group<Owner> = {pieces: Piece<Owner>[]; gap: Piece<Owner> | null; breakBefore: boolean; hardBreak: boolean}

const graphemeSegmenter = new Intl.Segmenter(undefined, {granularity: "grapheme"})

/** Общие строки сохраняют слова и grapheme clusters через границы inline-элементов. */
export function layoutInlineFlow<Owner>(
  inputs: readonly InlineInput<Owner>[],
  width: number,
  strut: number,
  align: "left" | "start" | "right" | "end" | "center",
  advance: (owner: Owner, text: string) => number,
  strutBaseline = strut * 0.8,
): InlinePlan<Owner> {
  const groups: Group<Owner>[] = []
  let current: Group<Owner> = {pieces: [], gap: null, breakBefore: false, hardBreak: false}
  let pending: {piece: Piece<Owner>; breakable: boolean} | null = null
  let preservedSpace = false
  let preservedCR = false
  const commit = () => {
    if (current.pieces.length > 0 || current.hardBreak) groups.push(current)
    current = {pieces: [], gap: null, breakBefore: false, hardBreak: false}
    preservedSpace = false
  }
  const append = (input: InlineInput<Owner>, text: string, sourceOffsets: number[] = [0]) => {
    const previous = current.pieces.at(-1)
    if (previous?.input === input && input.kind === "text") {
      previous.text += text
      previous.sourceOffsets.push(...sourceOffsets.slice(1))
      previous.width = advance(input.owner, previous.text)
    } else {
      current.pieces.push({input, text, sourceOffsets, width: input.kind === "text" ? advance(input.owner, text) : input.width})
    }
  }
  const flushSpace = () => {
    if (pending === null) return
    if (pending.breakable) {
      commit()
      current.gap = pending.piece
      current.breakBefore = true
    } else if (current.pieces.length > 0 || groups.length > 0) {
      append(pending.piece.input, " ", pending.piece.sourceOffsets)
    }
    pending = null
  }
  for (const input of inputs) {
    if (input.kind === "break") {
      preservedCR = false
      pending = null
      append(input, "")
      current.hardBreak = true
      commit()
      continue
    }
    if (input.kind === "box") {
      preservedCR = false
      flushSpace()
      const gap = current.gap
      commit()
      current.gap = gap
      current.breakBefore = input.whiteSpace === "normal" || input.whiteSpace === "pre-wrap"
      append(input, "")
      commit()
      current.breakBefore = input.whiteSpace === "normal" || input.whiteSpace === "pre-wrap"
      continue
    }
    if (input.whiteSpace === "pre-wrap") {
      flushSpace()
      const leadingLF = preservedCR
      if (input.text.length > 0) preservedCR = input.text.endsWith("\r")
      for (const match of input.text.matchAll(/\r\n|[\r\n]|[\t ]+|[^\t \r\n]+/gu)) {
        if (/^[\r\n]/u.test(match[0])) {
          if (leadingLF && match.index === 0 && match[0] === "\n") continue
          current.hardBreak = true
          commit()
        } else {
          const space = /^[\t ]/u.test(match[0])
          if (!space && preservedSpace) {
            commit()
            current.breakBefore = true
          }
          append(input, match[0], Array.from({length: match[0].length + 1}, (_, offset) => match.index + offset))
          preservedSpace = space
        }
      }
      continue
    }
    preservedCR = false
    if (input.whiteSpace === "pre") {
      flushSpace()
      const lines = input.text.split(/\r\n|\r|\n/u)
      let sourceOffset = 0
      for (const [index, text] of lines.entries()) {
        if (index > 0) {
          current.hardBreak = true
          commit()
        }
        if (text.length > 0) append(input, text, Array.from({length: text.length + 1}, (_, offset) => sourceOffset + offset))
        sourceOffset += text.length
        if (input.text[sourceOffset] === "\r" && input.text[sourceOffset + 1] === "\n") sourceOffset += 2
        else if (sourceOffset < input.text.length) sourceOffset++
      }
      continue
    }
    for (const match of input.text.matchAll(/[^\t\n\f\r ]+|[\t\n\f\r ]+/gu)) {
      if (/^[\t\n\f\r ]/u.test(match[0])) {
        pending ??= {piece: {input, text: " ", sourceOffsets: [match.index, match.index + match[0].length], width: advance(input.owner, " ")}, breakable: input.whiteSpace === "normal"}
      } else {
        flushSpace()
        if (preservedSpace) {
          commit()
          current.breakBefore = input.whiteSpace === "normal"
        }
        append(input, match[0], Array.from({length: match[0].length + 1}, (_, offset) => match.index + offset))
      }
    }
  }
  commit()

  const fragments: InlineFragment<Owner>[] = []
  let linePieces: Array<{piece: Piece<Owner>; x: number}> = []
  let x = 0
  let y = 0
  let line = 0
  let maximum = 0
  const appendToLine = (piece: Piece<Owner>) => {
    const previous = linePieces.at(-1)
    if (previous?.piece.input.owner === piece.input.owner &&
      previous.piece.input.kind === "text" && piece.input.kind === "text") {
      const text = previous.piece.text + piece.text
      const measured = advance(piece.input.owner, text)
      x += measured - previous.piece.width
      previous.piece = {input: piece.input, text, width: measured, sourceOffsets: [...previous.piece.sourceOffsets, ...piece.sourceOffsets.slice(1)]}
    } else {
      linePieces.push({piece, x})
      x += piece.width
    }
  }
  const prospectiveWidth = (pieces: readonly Piece<Owner>[]) => {
    let total = x
    let tail = linePieces.at(-1)?.piece
    for (const piece of pieces) {
      if (tail?.input.owner === piece.input.owner && tail.input.kind === "text" && piece.input.kind === "text") {
        const text = tail.text + piece.text
        const measured = advance(piece.input.owner, text)
        total += measured - tail.width
        tail = {input: piece.input, text, width: measured, sourceOffsets: []}
      } else {
        total += piece.width
        tail = piece
      }
    }
    return total
  }
  // Сохранённые пробелы висят за концом мягко перенесённой строки.
  // Перед явным разрывом и в конце текста они висят только при переполнении.
  const trailingPreservedWidth = () => {
    let trailing = 0
    for (let index = linePieces.length - 1; index >= 0; index--) {
      const {piece} = linePieces[index]!
      if (piece.input.kind !== "text" || piece.input.whiteSpace !== "pre-wrap") break
      const trimmed = piece.text.replace(/[\t ]+$/u, "")
      trailing += piece.width - advance(piece.input.owner, trimmed)
      if (trimmed.length > 0) break
    }
    return trailing
  }
  const finishLine = (forced = false, soft = false) => {
    if (linePieces.length === 0 && !forced) return
    const baseline = linePieces.reduce((maximum, {piece}) => Math.max(maximum, piece.input.baseline ?? piece.input.height), strutBaseline)
    const descent = linePieces.reduce((maximum, {piece}) => Math.max(maximum, piece.input.height - (piece.input.baseline ?? piece.input.height)), strut - strutBaseline)
    const height = baseline + descent
    const occupied = x - (soft || x > width ? trailingPreservedWidth() : 0)
    const free = Math.max(0, width - occupied)
    const offset = align === "center" ? free / 2 : align === "right" || align === "end" ? free : 0
    for (const {piece, x: left} of linePieces) {
      fragments.push(Object.freeze({
        owner: piece.input.owner,
        kind: piece.input.kind,
        text: piece.text,
        sourceOffsets: Object.freeze(piece.sourceOffsets),
        x: left + offset,
        y: y + baseline - (piece.input.baseline ?? piece.input.height),
        width: piece.width,
        height: piece.input.height,
        line,
      }))
    }
    maximum = Math.max(maximum, occupied)
    y += height
    line += 1
    x = 0
    linePieces = []
  }
  const fitPieces = (pieces: readonly Piece<Owner>[]) => {
    const result = [...pieces]
    while (result.length > 0) {
      const piece = result.at(-1)!
      if (piece.input.kind !== "text" || piece.input.whiteSpace !== "pre-wrap") break
      const text = piece.text.replace(/[\t ]+$/u, "")
      if (text.length === piece.text.length) break
      result.pop()
      if (text.length > 0) {
        result.push({input: piece.input, text, width: advance(piece.input.owner, text),
          sourceOffsets: piece.sourceOffsets.slice(0, text.length + 1)})
        break
      }
    }
    return result
  }
  const emergencyAllowed = (piece: Piece<Owner>) => piece.input.kind === "text" &&
    (piece.input.whiteSpace === "normal" || piece.input.whiteSpace === "pre-wrap") &&
    (piece.input.overflowWrap === "anywhere" || piece.input.overflowWrap === "break-word")
  const appendGroup = (pieces: readonly Piece<Owner>[]) => {
    if (pieces.some(piece => piece.input.kind !== "text") ||
      !pieces.some(emergencyAllowed) || prospectiveWidth(fitPieces(pieces)) <= width) {
      for (const piece of pieces) appendToLine(piece)
      return
    }
    // Сегментация целого слова не даёт разорвать кластер на границе Text/Element.
    const text = pieces.map(piece => piece.text).join("")
    let sourceOffset = 0
    const ranges = pieces.map(piece => {
      const start = sourceOffset
      sourceOffset += piece.text.length
      return {piece, start, end: sourceOffset}
    })
    let rangeIndex = 0
    const appendRange = (start: number, end: number, breakBefore: boolean) => {
      const batch: Piece<Owner>[] = []
      let cursor = start
      while (cursor < end) {
        const range = ranges[rangeIndex]!
        if (cursor >= range.end) {
          rangeIndex++
          continue
        }
        const localStart = cursor - range.start
        const localEnd = Math.min(end, range.end) - range.start
        const part = range.piece.text.slice(localStart, localEnd)
        batch.push({input: range.piece.input, text: part, width: advance(range.piece.input.owner, part),
          sourceOffsets: range.piece.sourceOffsets.slice(localStart, localEnd + 1)})
        cursor = range.start + localEnd
      }
      if (x > 0 && breakBefore && prospectiveWidth(fitPieces(batch)) > width) finishLine(false, true)
      for (const piece of batch) appendToLine(piece)
    }
    let segmentIndex = 0
    let batchStart = 0
    let batchBreakBefore = emergencyAllowed(pieces[0]!)
    let previous: Piece<Owner> | null = null
    for (const segment of graphemeSegmenter.segment(text)) {
      while (segment.index >= ranges[segmentIndex]!.end) segmentIndex++
      const first = ranges[segmentIndex]!.piece
      let lastIndex = segmentIndex
      const end = segment.index + segment.segment.length
      while (end > ranges[lastIndex]!.end) lastIndex++
      const last = ranges[lastIndex]!.piece
      const preservedWhitespace = first.input.whiteSpace === "pre-wrap" && /^[\t ]+$/u.test(segment.segment)
      const breakBefore = previous !== null && !preservedWhitespace &&
        emergencyAllowed(first) && emergencyAllowed(previous)
      if (breakBefore && segment.index > batchStart) {
        appendRange(batchStart, segment.index, batchBreakBefore)
        batchStart = segment.index
        batchBreakBefore = true
      }
      previous = last
    }
    // Между разрешёнными границами nowrap-участок измеряется целиком один раз.
    if (batchStart < text.length) appendRange(batchStart, text.length, batchBreakBefore)

  }
  for (const group of groups) {
    const pieces = x > 0 && group.gap !== null ? [group.gap, ...group.pieces] : group.pieces
    if (x > 0 && group.breakBefore && prospectiveWidth(fitPieces(pieces)) > width) finishLine(false, true)
    if (x > 0 && group.gap !== null) appendToLine(group.gap)
    appendGroup(group.pieces)
    if (group.hardBreak) finishLine(true)
  }
  finishLine()
  if (groups.at(-1)?.hardBreak && (inputs.at(-1)?.whiteSpace === "pre" || inputs.at(-1)?.whiteSpace === "pre-wrap")) finishLine(true)
  return Object.freeze({width: maximum, height: y, fragments: Object.freeze(fragments)})
}
