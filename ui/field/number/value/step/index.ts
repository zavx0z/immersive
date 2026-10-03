/**
Пошаговое изменение числового значения.
Реализация и её контракт принадлежат этому пакету; потребители используют его публичный вход.

@packageDocumentation
*/
import type {UiFieldsNumberValueStepNumberValue as Contract} from "./contract"
import type {UiFieldsNumberValueNormalizeNumberValue} from "@ui-fields-number-value/normalize-number-value"
type NumberValueOptions = NonNullable<UiFieldsNumberValueNormalizeNumberValue.Input[1]>
import normalizeNumberValue from "@ui-fields-number-value/normalize-number-value"
import numberPointerStep from "@ui-fields-number-value/number-pointer-step"
import resolveNumberSoftRange from "@ui-fields-number-value/resolve-number-soft-range"

export default function stepNumberValue(
  value: Contract.Input[0],
  direction: Contract.Input[1],
  options: Contract.Input[2] = {}
): Contract.Output {
  const range = resolveNumberSoftRange(value, options)
  const candidate = normalizeNumberValue(value + numberPointerStep(options) * direction, options)
  return direction < 0 ? Math.max(range.min, candidate) : Math.min(range.max, candidate)
}

export type {UiFieldsNumberValueStepNumberValue} from "./contract"
