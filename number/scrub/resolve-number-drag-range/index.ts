/**
Определение диапазона числового перетаскивания.
Реализация и её контракт принадлежат этому пакету; потребители используют его публичный вход.

@packageDocumentation
*/
import type {ResolveNumberDragRangeInput} from "./contract/input"
import normalizeNumberValue from "@ui-fields-number-value/normalize-number-value"
import numberPointerAdaptiveSpan from "@ui-fields-number-value/number-pointer-adaptive-span"
import resolveNumberSoftRange from "@ui-fields-number-value/resolve-number-soft-range"
import type {NumberRange} from "@ui-fields-number-value/resolve-number-soft-range"
import type {NumberValueOptions} from "@ui-fields-number-value/normalize-number-value"

export default function resolveNumberDragRange(
  value: ResolveNumberDragRangeInput[0],
  options: ResolveNumberDragRangeInput[1]
): NumberRange {
  const range = resolveNumberSoftRange(value, options)
  const span = range.max - range.min
  const maximumSpan = numberPointerAdaptiveSpan(options)
  if (span <= maximumSpan) return range
  const center = normalizeNumberValue(value, options)
  let minimum = center - maximumSpan / 2
  let maximum = center + maximumSpan / 2
  if (minimum < range.min) {
    minimum = range.min
    maximum = minimum + maximumSpan
  }
  else if (maximum > range.max) {
    maximum = range.max
    minimum = maximum - maximumSpan
  }
  return Object.freeze({min: minimum, max: maximum})
}

export type {ResolveNumberDragRangeInput} from "./contract/input"
