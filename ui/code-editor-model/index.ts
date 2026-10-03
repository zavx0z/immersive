/**
Модель текста, нескольких выделений, IME и истории редактора.
Реализация и её контракт принадлежат этому пакету; потребители используют его публичный вход.

@packageDocumentation
*/
import type {UiCodeEditorModel as Contract} from "./contract"
import type {CodeEditorMovementUnit} from "./contract/types.ts"
import type {CodeEditorRange} from "./contract/types.ts"
import type {CodeEditorSnapshot} from "./contract/types.ts"
import type {EditorState} from "./src/types"
import type {SegmentedLine} from "./src/types"
import {lineBounds} from "./src/helpers.ts"
import {mapExternalValue} from "./src/helpers.ts"
import {normalizeSelections} from "./src/helpers.ts"
import {replaceSelections} from "./src/helpers.ts"
import {sameSelections} from "./src/helpers.ts"
import {sameState} from "./src/helpers.ts"
import {textValue} from "./src/helpers.ts"

export type {UiCodeEditorModel} from "./contract"

export default class CodeEditorModel implements Contract.Output {
  #state: EditorState
  #snapshot: CodeEditorSnapshot
  #readOnly: boolean
  #revision = 0
  #historyLimit: number
  #undo: EditorState[] = []
  #redo: EditorState[] = []
  #composition: EditorState | null = null
  #listeners = new Set<(snapshot: CodeEditorSnapshot) => void>()
  #lineSegments = new Map<string, SegmentedLine>()
  #graphemeSegmenter: Intl.Segmenter | null = null
  #wordSegmenter: Intl.Segmenter | null = null
  #preferredColumns: readonly number[] | null = null

  constructor(options: Contract.Input) {
    const value = textValue(options.value)
    this.#historyLimit = options.historyLimit ?? 100
    if (!Number.isSafeInteger(this.#historyLimit) || this.#historyLimit < 0) {
      throw new RangeError("Editor historyLimit must be a non-negative integer")
    }
    this.#readOnly = options.readOnly ?? false
    if (typeof this.#readOnly !== "boolean") throw new TypeError("Editor readOnly must be a boolean")
    this.#state = {value, ...normalizeSelections(value, options.selections ?? [{anchor: 0, head: 0}], options.primary ?? 0)}
    this.#snapshot = this.#makeSnapshot()
  }

  get snapshot(): CodeEditorSnapshot {
    return this.#snapshot
  }

  /** Subscribes to subsequent state changes, not an immediate initial emission. */
  subscribe(listener: (snapshot: CodeEditorSnapshot) => void): () => void {
    this.#listeners.add(listener)
    return () => { this.#listeners.delete(listener) }
  }

  setSelections(ranges: readonly CodeEditorRange[], primary = 0): boolean {
    if (this.#composition) return false
    this.#preferredColumns = null
    const next = {...this.#state, ...normalizeSelections(this.#state.value, ranges, primary)}
    if (sameSelections(this.#state, next)) return false
    this.#publish(next)
    return true
  }

  addSelection(range: CodeEditorRange): boolean {
    return this.setSelections([...this.#state.selections, range], this.#state.selections.length)
  }

  selectedText(separator = "\n"): string {
    return this.#state.selections.filter(range => range.anchor !== range.head)
      .map(range => this.#state.value.slice(Math.min(range.anchor, range.head), Math.max(range.anchor, range.head)))
      .join(separator)
  }

  /** Non-extended movement first collapses non-empty ranges towards the direction. */
  move(direction: "backward" | "forward", options: Readonly<{unit?: CodeEditorMovementUnit; extend?: boolean}> = {}): boolean {
    if (this.#composition) return false
    const ranges = this.#state.selections.map(range => {
      const position = !options.extend && range.anchor !== range.head
        ? direction === "backward" ? Math.min(range.anchor, range.head) : Math.max(range.anchor, range.head)
        : this.#boundary(range.head, direction, options.unit ?? "grapheme")
      return {anchor: options.extend ? range.anchor : position, head: position}
    })
    return this.setSelections(ranges, this.#state.primary)
  }

  /** Logical unwrapped-line movement, retaining each caret's desired UTF-16 column across short lines. */
  moveVertical(direction: "up" | "down", options: Readonly<{extend?: boolean}> = {}): boolean {
    if (this.#composition) return false
    const columns: number[] = []
    const value = this.#state.value
    const ranges = this.#state.selections.map((range, index) => {
      const line = this.#lineAt(range.head)
      const column = this.#preferredColumns?.[index] ?? range.head - line.start
      columns.push(column)
      const target = direction === "up" ? this.#lineAt(Math.max(0, line.start - 1)) : this.#lineAt(line.end)
      let end = target.end
      if (value[end - 1] === "\n") end--
      if (value[end - 1] === "\r") end--
      const edge = direction === "up" && line.start === 0 ? 0
        : direction === "down" && line.end === value.length && value[line.end - 1] !== "\n" ? value.length
        : Math.min(end, target.start + column)
      const head = this.#graphemeEdge(edge, "backward")
      return {anchor: options.extend ? range.anchor : head, head}
    })
    const changed = this.setSelections(ranges, this.#state.primary)
    if (ranges.length === this.#state.selections.length) this.#preferredColumns = columns
    return changed
  }

  insertText(text: string): boolean {
    textValue(text)
    if (!this.#canEdit()) return false
    return this.#transact(replaceSelections(this.#state, this.#state.selections.map(() => text)))
  }

  /** Equal-count lines/ranges distribute in source order; otherwise insert the whole payload at every range. */
  paste(payload: string | readonly string[]): boolean {
    const rows = typeof payload === "string" ? payload.split(/\r\n|\r|\n/u) : payload.map(textValue)
    const text = typeof payload === "string" ? payload : rows.join("\n")
    if (!this.#canEdit()) return false
    const texts = rows.length === this.#state.selections.length ? rows : this.#state.selections.map(() => text)
    return this.#transact(replaceSelections(this.#state, texts))
  }

  deleteBackward(unit: CodeEditorMovementUnit = "grapheme"): boolean {
    return this.#delete("backward", unit)
  }

  deleteForward(unit: CodeEditorMovementUnit = "grapheme"): boolean {
    return this.#delete("forward", unit)
  }

  undo(): boolean {
    if (this.#readOnly) return false
    if (this.#composition) return this.cancelComposition()
    const previous = this.#undo.pop()
    if (!previous) return false
    this.#redo.push(this.#state)
    this.#publish(previous)
    return true
  }

  redo(): boolean {
    if (!this.#canEdit()) return false
    const next = this.#redo.pop()
    if (!next) return false
    this.#undo.push(this.#state)
    this.#publish(next)
    return true
  }

  setReadOnly(readOnly: boolean): boolean {
    if (typeof readOnly !== "boolean") throw new TypeError("Editor readOnly must be a boolean")
    if (this.#readOnly === readOnly) return false
    const next = this.#composition ?? this.#state
    this.#composition = null
    this.#readOnly = readOnly
    this.#publish(next)
    return true
  }

  /**
   * External value replacement is not an editor transaction: cancels composition and
   * clears undo/redo. Explicitly reset the caret, or map ranges through the smallest
   * single replacement found using the common prefix/suffix (right-affine boundaries).
   */
  replaceValue(value: string, options: Readonly<{selection: "reset" | "map"}>): boolean {
    textValue(value)
    if (options.selection !== "reset" && options.selection !== "map") throw new TypeError("Explicit replacement selection policy required")
    // Controlled consumers echo composition previews through props. An identical
    // value is not an external edit and must not cancel the ongoing IME session.
    if (value === this.#state.value) return false
    const base = this.#composition ?? this.#state
    const next = options.selection === "map" ? mapExternalValue(base, value)
      : {value, ...normalizeSelections(value, [], 0)}
    this.#composition = null
    this.#undo = []
    this.#redo = []
    this.#publish(next)
    return true
  }

  beginComposition(): boolean {
    if (!this.#canEdit()) return false
    this.#composition = this.#state
    this.#publish(this.#state)
    return true
  }

  updateComposition(text: string): boolean {
    textValue(text)
    if (this.#readOnly || !this.#composition) return false
    const base = this.#composition
    const next = replaceSelections(base, base.selections.map(() => text))
    if (sameState(this.#state, next)) return false
    this.#publish(next)
    return true
  }

  /** Optional final text replaces the preview; one committed composition is one undo step. */
  commitComposition(text?: string): boolean {
    if (text !== undefined) textValue(text)
    if (this.#readOnly || !this.#composition) return false
    const base = this.#composition
    const next = text === undefined ? this.#state : replaceSelections(base, base.selections.map(() => text))
    this.#composition = null
    if (!sameState(base, next)) this.#record(base)
    this.#publish(next)
    return true
  }

  cancelComposition(): boolean {
    const base = this.#composition
    if (!base) return false
    this.#composition = null
    this.#publish(base)
    return true
  }

  #canEdit(): boolean {
    return !this.#readOnly && this.#composition === null
  }

  #delete(direction: "backward" | "forward", unit: CodeEditorMovementUnit): boolean {
    if (!this.#canEdit()) return false
    const ranges = this.#state.selections.map(range => {
      if (range.anchor !== range.head) return range
      const other = this.#boundary(range.head, direction, unit)
      // Programmatic UTF-16 carets may lie inside a grapheme: never delete half of it.
      const head = unit === "grapheme" ? this.#graphemeEdge(range.head, direction === "backward" ? "forward" : "backward") : range.head
      return {anchor: head, head: other}
    })
    const normalized = {...this.#state, ...normalizeSelections(this.#state.value, ranges, this.#state.primary)}
    return this.#transact(replaceSelections(normalized, normalized.selections.map(() => "")))
  }

  #record(previous: EditorState): void {
    if (this.#historyLimit > 0) {
      this.#undo.push(previous)
      if (this.#undo.length > this.#historyLimit) this.#undo.shift()
    }
    this.#redo = []
  }

  #transact(next: EditorState): boolean {
    if (sameState(this.#state, next)) return false
    this.#record(this.#state)
    this.#publish(next)
    return true
  }

  #makeSnapshot(): CodeEditorSnapshot {
    return Object.freeze({...this.#state, revision: this.#revision, readOnly: this.#readOnly,
      composing: this.#composition !== null, canUndo: this.#undo.length > 0, canRedo: this.#redo.length > 0})
  }

  #publish(next: EditorState): void {
    if (next.value !== this.#state.value) {
      this.#revision++
      this.#preferredColumns = null
    }
    this.#state = next
    this.#snapshot = this.#makeSnapshot()
    for (const listener of [...this.#listeners]) listener(this.#snapshot)
  }

  #lineAt(position: number): {start: number; end: number; text: string; segments: SegmentedLine} {
    const value = this.#state.value
    const {start, end} = lineBounds(value, position)
    const text = value.slice(start, end)
    let segments = this.#lineSegments.get(text)
    if (!segments) {
      this.#graphemeSegmenter ??= new Intl.Segmenter(undefined, {granularity: "grapheme"})
      segments = {graphemes: [...this.#graphemeSegmenter.segment(text)].map(segment => segment.index), words: null}
      segments.graphemes = [...segments.graphemes, text.length]
      if (this.#lineSegments.size >= 32) this.#lineSegments.delete(this.#lineSegments.keys().next().value!)
    } else this.#lineSegments.delete(text)
    this.#lineSegments.set(text, segments)
    return {start, end, text, segments}
  }

  #graphemeIndex(boundaries: readonly number[], position: number): number {
    let low = 0
    let high = boundaries.length
    while (low < high) {
      const mid = (low + high) >>> 1
      if (boundaries[mid]! < position) low = mid + 1
      else high = mid
    }
    return low
  }

  #graphemeEdge(position: number, direction: "backward" | "forward"): number {
    const line = this.#lineAt(position)
    const boundaries = line.segments.graphemes
    const local = position - line.start
    const index = this.#graphemeIndex(boundaries, local)
    return boundaries[index] === local ? position
      : line.start + boundaries[direction === "backward" ? index - 1 : index]!
  }

  #boundary(position: number, direction: "backward" | "forward", unit: CodeEditorMovementUnit): number {
    const value = this.#state.value
    if (unit === "document") return direction === "backward" ? 0 : value.length
    if (unit === "line") {
      const line = lineBounds(value, position)
      if (direction === "backward") return line.start
      let end = line.end
      if (value[end - 1] === "\n") end--
      if (value[end - 1] === "\r") end--
      return end
    }
    let line = this.#lineAt(position)
    if (unit === "word") {
      for (;;) {
        this.#wordSegmenter ??= new Intl.Segmenter(undefined, {granularity: "word"})
        line.segments.words ??= [...this.#wordSegmenter.segment(line.text)].filter(segment => segment.isWordLike)
          .map(segment => ({start: segment.index, end: segment.index + segment.segment.length}))
        if (direction === "backward") {
          for (let index = line.segments.words.length - 1; index >= 0; index--) {
            const word = line.segments.words[index]!
            if (line.start + word.start < position) return line.start + word.start
          }
          if (line.start === 0) return 0
          line = this.#lineAt(line.start - 1)
        } else {
          const word = line.segments.words.find(word => line.start + word.end > position)
          if (word) return line.start + word.end
          if (line.end === value.length) return value.length
          line = this.#lineAt(line.end)
        }
      }
    }
    const boundaries = line.segments.graphemes
    const local = position - line.start
    const index = this.#graphemeIndex(boundaries, local)
    if (direction === "backward") {
      if (local === 0 && line.start > 0) return line.start - (value[line.start - 1] === "\n" && value[line.start - 2] === "\r" ? 2 : 1)
      return line.start + boundaries[Math.max(0, index - 1)]!
    }
    return line.start + boundaries[Math.min(boundaries.length - 1, index + Number(boundaries[index] === local))]!
  }
}
