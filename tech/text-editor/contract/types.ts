/** Направленное выделение в UTF-16 позициях одного текста, независимое от DOM. */
export type Range = Readonly<{
  anchor: number
  head: number
}>

/** Неизменяемый снимок текста и всех кареток; возможности undo/redo принадлежат той же модели. */
export type Snapshot = Readonly<{
  value: string
  /** Монотонная ревизия текста, включая preview композиции и undo/redo. */
  revision: number
  selections: readonly Range[]
  primary: number
  readOnly: boolean
  composing: boolean
  canUndo: boolean
  canRedo: boolean
}>

/** Единица логического перемещения или удаления в тексте. */
export type MovementUnit = "grapheme" | "word" | "line" | "document"
