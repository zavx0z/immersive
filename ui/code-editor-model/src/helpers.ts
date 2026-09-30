import type {CodeEditorRange} from "../contract/types.ts"
import type {EditorState} from "../contract/types.ts"
import type {NormalizedSelections} from "../contract/types.ts"
import type {SelectionEntry} from "../contract/types.ts"

/** Частная подготовка модель текста, нескольких выделений, ime и истории редактора. */
export function textValue(value: string): string {
  if (typeof value !== "string") throw new TypeError("Editor value must be a string")
  return value
}

/** Частная подготовка модель текста, нескольких выделений, ime и истории редактора. */
export function lineBounds(value: string, position: number): {start: number; end: number} {
  let start = 0
  let end = value.length
  // Stop at the nearest separator of either kind. Two independent indexOf calls
  // would scan an entire LF-only document looking for an absent CR on each key.
  for (let index = position - 1; index >= 0; index--) {
    const character = value.charCodeAt(index)
    if (character === 10 || character === 13 && value.charCodeAt(index + 1) !== 10) {
      start = index + 1
      break
    }
  }
  for (let index = position; index < value.length; index++) {
    const character = value.charCodeAt(index)
    if (character === 10 || character === 13) {
      end = index + (character === 13 && value.charCodeAt(index + 1) === 10 ? 2 : 1)
      break
    }
  }
  return {start, end}
}

/** Частная подготовка модель текста, нескольких выделений, ime и истории редактора. */
export function offset(value: number, length: number): number {
  if (!Number.isSafeInteger(value)) throw new RangeError("Editor offsets must be safe integers")
  return Math.max(0, Math.min(length, value))
}

/** Частная подготовка модель текста, нескольких выделений, ime и истории редактора. */
export function normalizeSelections(
  value: string,
  ranges: readonly CodeEditorRange[],
  primary: number,
): NormalizedSelections {
  if (ranges.length === 0) return {selections: Object.freeze([Object.freeze({anchor: 0, head: 0})]), primary: 0}
  if (!Number.isSafeInteger(primary) || primary < 0 || primary >= ranges.length) {
    throw new RangeError("Primary selection must identify an existing range")
  }
  const entries = ranges.map((range, index): SelectionEntry => {
    const anchor = offset(range.anchor, value.length)
    const head = offset(range.head, value.length)
    return {start: Math.min(anchor, head), end: Math.max(anchor, head), backward: anchor > head, primary: index === primary}
  }).sort((left, right) => left.start - right.start || right.end - left.end)
  const groups: SelectionEntry[] = []
  for (const entry of entries) {
    const previous = groups.at(-1)
    const touchesCaret = previous && entry.start === previous.end &&
      (entry.start === entry.end || previous.start === previous.end)
    if (previous && (entry.start < previous.end || touchesCaret)) {
      previous.end = Math.max(previous.end, entry.end)
      if (entry.primary) previous.backward = entry.backward
      previous.primary ||= entry.primary
    } else groups.push({...entry})
  }
  return {
    selections: Object.freeze(groups.map(range => Object.freeze(range.backward
      ? {anchor: range.end, head: range.start}
      : {anchor: range.start, head: range.end}))),
    primary: groups.findIndex(range => range.primary),
  }
}

/** Частная подготовка модель текста, нескольких выделений, ime и истории редактора. */
export function sameSelections(left: EditorState, right: EditorState): boolean {
  return left.primary === right.primary && left.selections.length === right.selections.length &&
    left.selections.every((range, index) => range.anchor === right.selections[index]!.anchor &&
      range.head === right.selections[index]!.head)
}

/** Частная подготовка модель текста, нескольких выделений, ime и истории редактора. */
export function sameState(left: EditorState, right: EditorState): boolean {
  return left.value === right.value && sameSelections(left, right)
}

/** Частная подготовка модель текста, нескольких выделений, ime и истории редактора. */
export function replaceSelections(state: EditorState, texts: readonly string[]): EditorState {
  const parts: string[] = []
  const ranges: CodeEditorRange[] = []
  let sourceOffset = 0
  let outputOffset = 0
  for (let index = 0; index < state.selections.length; index++) {
    const range = state.selections[index]!
    const start = Math.min(range.anchor, range.head)
    const end = Math.max(range.anchor, range.head)
    const replacement = texts[index]!
    const prefix = state.value.slice(sourceOffset, start)
    parts.push(prefix, replacement)
    outputOffset += prefix.length + replacement.length
    ranges.push({anchor: outputOffset, head: outputOffset})
    sourceOffset = end
  }
  parts.push(state.value.slice(sourceOffset))
  const value = parts.join("")
  return {value, ...normalizeSelections(value, ranges, state.primary)}
}

/** Частная подготовка модель текста, нескольких выделений, ime и истории редактора. */
export function mapExternalValue(state: EditorState, value: string): EditorState {
  let start = 0
  let oldEnd = state.value.length
  let newEnd = value.length
  while (start < oldEnd && start < newEnd && state.value[start] === value[start]) start++
  while (oldEnd > start && newEnd > start && state.value[oldEnd - 1] === value[newEnd - 1]) {
    oldEnd--
    newEnd--
  }
  const map = (position: number) => position < start ? position
    : position >= oldEnd ? position + newEnd - oldEnd
    : newEnd
  return {value, ...normalizeSelections(value, state.selections.map(range => ({
    anchor: map(range.anchor), head: map(range.head),
  })), state.primary)}
}
