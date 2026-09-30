import type {NumberValueOptions} from "./types"

/** Аргументы публичной операции normalizeNumberValue; порядок сохраняет её форму вызова. */
export type NormalizeNumberValueInput = readonly [
  value: number,
  options?: NumberValueOptions
]
