import type {CodeEditorRange} from "../contract/types"

/** Частное состояние транзакции до публикации снимка. */
export type EditorState = Readonly<{
  value: string
  selections: readonly CodeEditorRange[]
  primary: number
}>

export type NormalizedSelections = Pick<EditorState, "selections" | "primary">

export type SelectionEntry = {
  start: number
  end: number
  backward: boolean
  primary: boolean
}

/** Кэш границ Unicode и слов одной логической строки. */
export type SegmentedLine = {
  graphemes: readonly number[]
  words: readonly Readonly<{
    start: number
    end: number
  }>[] | null
}
