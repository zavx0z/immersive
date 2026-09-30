import type {FieldDensity} from "./types.ts"

/** Аргументы публичной операции resolveFieldDensity; порядок сохраняет её форму вызова. */
export type ResolveFieldDensityInput = readonly [
  value: FieldDensity | undefined,
  fallback: FieldDensity,
  owner: string
]
