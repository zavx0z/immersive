

/** A directional, UTF-16 selection in one editor value, independent of DOM nodes. */
export type CodeEditorRange = Readonly<{anchor: number; head: number}>

/**
Тип CodeEditorSnapshot принадлежит контракту своего владельца.
*/
export type CodeEditorSnapshot = Readonly<{
  value: string
  /** Monotonic text revision, including composition previews and undo/redo. */
  revision: number
  selections: readonly CodeEditorRange[]
  primary: number
  readOnly: boolean
  composing: boolean
  canUndo: boolean
  canRedo: boolean
}>

/**
Тип CodeEditorMovementUnit принадлежит контракту своего владельца.
*/
export type CodeEditorMovementUnit = "grapheme" | "word" | "line" | "document"

/**
Тип EditorState принадлежит контракту своего владельца.
*/
export type EditorState = Readonly<{
  value: string
  selections: readonly CodeEditorRange[]
  primary: number
}>

/**
Тип NormalizedSelections принадлежит контракту своего владельца.
*/
export type NormalizedSelections = Pick<EditorState, "selections" | "primary">

/**
Тип SelectionEntry принадлежит контракту своего владельца.
*/
export type SelectionEntry = {start: number; end: number; backward: boolean; primary: boolean}

/**
Тип SegmentedLine принадлежит контракту своего владельца.
*/
export type SegmentedLine = {
  graphemes: readonly number[]
  words: readonly Readonly<{start: number; end: number}>[] | null
}
