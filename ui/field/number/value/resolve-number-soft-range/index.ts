/**
Определение мягкого числового диапазона.
Реализация и её контракт принадлежат этому пакету; потребители используют его публичный вход.

@packageDocumentation
*/
import type {ResolveNumberSoftRangeInput} from "./contract/input"
import type {NumberRange} from "./contract/types"
import type {NumberValueOptions} from "@ui-fields-number-value/normalize-number-value"
import finiteBound from "@ui-fields-number-value/finite-bound"
import normalizeNumberValue from "@ui-fields-number-value/normalize-number-value"
import numberPointerAdaptiveSpan from "@ui-fields-number-value/number-pointer-adaptive-span"
import numberPointerStep from "@ui-fields-number-value/number-pointer-step"

export default function resolveNumberSoftRange(
  value: ResolveNumberSoftRangeInput[0],
  options: ResolveNumberSoftRangeInput[1] = {}
): NumberRange {
  const hardMin = finiteBound(options.min, Number.NEGATIVE_INFINITY)
  const hardMax = Math.max(hardMin, finiteBound(options.max, Number.POSITIVE_INFINITY))
  const center = normalizeNumberValue(value, options)
  const step = numberPointerStep(options)
  const adaptiveSpan = numberPointerAdaptiveSpan(options)
  let minimum = Number.isFinite(options.softMin)
    ? options.softMin!
    : Number.isFinite(hardMin)
      ? hardMin
      : center - adaptiveSpan / 2
  let maximum = Number.isFinite(options.softMax)
    ? options.softMax!
    : Number.isFinite(hardMax)
      ? hardMax
      : center + adaptiveSpan / 2
  if (minimum > maximum) [minimum, maximum] = [maximum, minimum]
  minimum = Math.max(hardMin, minimum)
  maximum = Math.min(hardMax, maximum)
  if (minimum > maximum) minimum = maximum
  if (minimum === maximum) {
    if (maximum + step <= hardMax) maximum += step
    else if (minimum - step >= hardMin) minimum -= step
  }
  return Object.freeze({min: minimum, max: maximum})
}

export type {NumberRange} from "./contract/types"

export type {ResolveNumberSoftRangeInput} from "./contract/input"
