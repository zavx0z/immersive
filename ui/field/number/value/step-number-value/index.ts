/**
Пошаговое изменение числового значения.
Реализация и её контракт принадлежат этому пакету; потребители используют его публичный вход.

@packageDocumentation
*/
import type {StepNumberValueInput} from "./contract/input"
import type {NumberValueOptions} from "@ui-fields-number-value/normalize-number-value"
import normalizeNumberValue from "@ui-fields-number-value/normalize-number-value"
import numberPointerStep from "@ui-fields-number-value/number-pointer-step"
import resolveNumberSoftRange from "@ui-fields-number-value/resolve-number-soft-range"

export default function stepNumberValue(
  value: StepNumberValueInput[0],
  direction: StepNumberValueInput[1],
  options: StepNumberValueInput[2] = {}
): number {
  const range = resolveNumberSoftRange(value, options)
  const candidate = normalizeNumberValue(value + numberPointerStep(options) * direction, options)
  return direction < 0 ? Math.max(range.min, candidate) : Math.min(range.max, candidate)
}

export type {StepNumberValueInput} from "./contract/input"
