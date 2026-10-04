/**
Определение мягкого числового диапазона.
Реализация и её контракт принадлежат этому пакету; потребители используют его публичный вход.

@packageDocumentation
*/
import type {ImmersiveUiFieldNumberValueSoftRange as Contract} from "./contract"
import type {ImmersiveUiFieldNumberValueNormalize} from "@immersive-ui-field-number-value/normalize"
type NumberValueOptions = NonNullable<ImmersiveUiFieldNumberValueNormalize.Input[1]>
import finiteBound from "@immersive-ui-field-number-value/finite-bound"
import normalizeNumberValue from "@immersive-ui-field-number-value/normalize"
import numberPointerAdaptiveSpan from "@immersive-ui-field-number-value/pointer-adaptive-span"
import numberPointerStep from "@immersive-ui-field-number-value/pointer-step"

export default function resolveNumberSoftRange(
  value: Contract.Input[0],
  options: Contract.Input[1] = {}
): Contract.Output {
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

export type {ImmersiveUiFieldNumberValueSoftRange} from "./contract"
