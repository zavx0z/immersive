/**
Проверяет координаты, оси и шаг вектора из 2–4 измерений и возвращает неизменяемую копию.
Реализация и её контракт принадлежат этому пакету; потребители используют его публичный вход.

@packageDocumentation
*/
import type {Zavx0zImmersiveUiFieldVectorValueNormalize as Contract} from "./contract"
export type {Zavx0zImmersiveUiFieldVectorValueNormalize} from "./contract"


export default function normalizeVectorValue(
  value: Contract.Input[0],
  axes: Contract.Input[1],
  step: Contract.Input[2]
): Contract.Output {
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
