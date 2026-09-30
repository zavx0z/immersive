/**
Нормализация вектора.
Реализация и её контракт принадлежат этому пакету; потребители используют его публичный вход.

@packageDocumentation
*/
import type {NormalizeVectorValueOutput} from "./contract/output"
import type {NormalizeVectorValueInput} from "./contract/input"

export default function normalizeVectorValue(
  value: NormalizeVectorValueInput[0],
  axes: NormalizeVectorValueInput[1],
  step: NormalizeVectorValueInput[2]
): NormalizeVectorValueOutput {
  if (!Array.isArray(value) || value.length < 2 || value.length > 4 || !value.every(Number.isFinite)) {
    throw new TypeError("VectorField value must contain 2 to 4 finite numbers")
  }
  const normalizedAxes = axes ?? ["X", "Y", "Z", "W"].slice(0, value.length)
  if (normalizedAxes.length !== value.length || new Set(normalizedAxes).size !== normalizedAxes.length || normalizedAxes.some(axis => typeof axis !== "string" || axis.length === 0)) {
    throw new Error("VectorField axes must be unique and match value length")
  }
  const normalizedStep = step ?? 0.1
  if (!Number.isFinite(normalizedStep) || normalizedStep <= 0) throw new RangeError("VectorField step must be positive")
  return Object.freeze({
    value: Object.freeze([...value]),
    axes: Object.freeze([...normalizedAxes]),
    step: normalizedStep
  })
}

export type {NormalizeVectorValueInput} from "./contract/input"

export type {NormalizeVectorValueOutput} from "./contract/output"
