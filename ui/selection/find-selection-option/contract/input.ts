import type {SelectionOptionShape} from "@ui-selection/validate-selection-options"

/** Аргументы публичной операции findSelectionOption; порядок сохраняет её форму вызова. */
export type FindSelectionOptionInput<T extends SelectionOptionShape> = readonly [
  value: string,
  options: readonly T[]
]
