/** Направленное выделение в UTF-16 позициях одного текста, независимое от DOM. */
export type CodeEditorRange = Readonly<{
  anchor: number
  head: number
}>

/** Неизменяемый снимок текста и всех кареток; возможности undo/redo принадлежат той же модели. */
export type CodeEditorSnapshot = Readonly<{
  value: string
  /** Монотонная ревизия текста, включая preview композиции и undo/redo. */
  revision: number
  selections: readonly CodeEditorRange[]
  primary: number
  readOnly: boolean
  composing: boolean
  canUndo: boolean
  canRedo: boolean
}>

/** Единица логического перемещения или удаления в тексте. */
export type CodeEditorMovementUnit = "grapheme" | "word" | "line" | "document"
