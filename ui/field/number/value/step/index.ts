/**
Пошаговое изменение числового значения.
Реализация и её контракт принадлежат этому пакету; потребители используют его публичный вход.

@packageDocumentation
*/
import type {ImmersiveUiFieldNumberValueStep as Contract} from "./contract"
import normalizeNumberValue from "@zavx0z/immersive-ui-field-number-value-normalize"
import numberPointerStep from "@zavx0z/immersive-ui-field-number-value-step-pointer"
import resolveNumberSoftRange from "@zavx0z/immersive-ui-field-number-value-soft-range"

export default function stepNumberValue(
  value: Contract.Input[0],
  direction: Contract.Input[1],
  options: Contract.Input[2] = {}
): Contract.Output {
  const range = resolveNumberSoftRange(value, options)
  const candidate = normalizeNumberValue(value + numberPointerStep(options) * direction, options)
  return direction < 0 ? Math.max(range.min, candidate) : Math.min(range.max, candidate)
}

export type {ImmersiveUiFieldNumberValueStep} from "./contract"
