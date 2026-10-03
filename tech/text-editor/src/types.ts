import type {Range} from "../contract/types"

/** Частное состояние транзакции до публикации снимка. */
export type State = Readonly<{
  value: string
  selections: readonly Range[]
  primary: number
}>

export type NormalizedSelections = Pick<State, "selections" | "primary">

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
