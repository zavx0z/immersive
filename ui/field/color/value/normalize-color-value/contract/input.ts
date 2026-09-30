import type {ColorValue} from "./types.ts"

/** Аргументы публичной операции normalizeColorValue; порядок сохраняет её форму вызова. */
export type NormalizeColorValueInput = readonly [
  value: Partial<ColorValue>
]
