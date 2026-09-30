/**
Нормализация матрицы.
Реализация и её контракт принадлежат этому пакету; потребители используют его публичный вход.

@packageDocumentation
*/
import type {NormalizeMatrixValueOutput} from "./contract/output"
import type {NormalizeMatrixValueInput} from "./contract/input"

export default function normalizeMatrixValue(
  value: NormalizeMatrixValueInput[0],
  step: NormalizeMatrixValueInput[1]
): NormalizeMatrixValueOutput {
  if (!Array.isArray(value) || value.length < 2 || value.length > 4) {
    throw new TypeError("MatrixField must contain 2 to 4 rows")
  }
  const size = value.length
  if (value.some(row => !Array.isArray(row) || row.length !== size || !row.every(Number.isFinite))) {
    throw new TypeError("MatrixField value must be a square finite matrix")
  }
  const normalizedStep = step ?? 0.1
  if (!Number.isFinite(normalizedStep) || normalizedStep <= 0) throw new RangeError("MatrixField step must be positive")
  return Object.freeze({
    value: Object.freeze(value.map(row => Object.freeze([...row]))),
    step: normalizedStep
  })
}

export type {NormalizeMatrixValueInput} from "./contract/input"

export type {NormalizeMatrixValueOutput} from "./contract/output"
