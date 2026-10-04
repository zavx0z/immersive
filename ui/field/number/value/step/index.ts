/**
Пошаговое изменение числового значения.
Реализация и её контракт принадлежат этому пакету; потребители используют его публичный вход.

@packageDocumentation
*/
import type {ImmersiveUiFieldNumberValueStep as Contract} from "./contract"
import type {ImmersiveUiFieldNumberValueNormalize} from "@immersive-ui-field-number-value/normalize"
type NumberValueOptions = NonNullable<ImmersiveUiFieldNumberValueNormalize.Input[1]>
import normalizeNumberValue from "@immersive-ui-field-number-value/normalize"
import numberPointerStep from "@immersive-ui-field-number-value/pointer-step"
import resolveNumberSoftRange from "@immersive-ui-field-number-value/soft-range"

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
