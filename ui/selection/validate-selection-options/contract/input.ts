import type {SelectionOptionShape} from "./types.ts"

/** Аргументы публичной операции validateSelectionOptions; порядок сохраняет её форму вызова. */
export type ValidateSelectionOptionsInput<T extends SelectionOptionShape> = readonly [
  options: readonly T[]
]
