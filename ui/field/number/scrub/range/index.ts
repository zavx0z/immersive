/**
Определение диапазона числового перетаскивания.
Реализация и её контракт принадлежат этому пакету; потребители используют его публичный вход.

@packageDocumentation
*/
import type {Zavx0zImmersiveUiFieldNumberScrubRange as Contract} from "./contract"
import normalizeNumberValue from "@zavx0z/immersive-ui-field-number-value-normalize"
import numberPointerAdaptiveSpan from "@zavx0z/immersive-ui-field-number-value-pointer-adaptive-span"
import resolveNumberSoftRange from "@zavx0z/immersive-ui-field-number-value-soft-range"
import type {Zavx0zImmersiveUiFieldNumberValueSoftRange} from "@zavx0z/immersive-ui-field-number-value-soft-range"
type NumberRange = Zavx0zImmersiveUiFieldNumberValueSoftRange.Output
import type {Zavx0zImmersiveUiFieldNumberValueNormalize} from "@zavx0z/immersive-ui-field-number-value-normalize"
type NumberValueOptions = NonNullable<Zavx0zImmersiveUiFieldNumberValueNormalize.Input[1]>

export default function resolveNumberDragRange(
  value: Contract.Input[0],
  options: Contract.Input[1]
): Contract.Output {
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

export type {Zavx0zImmersiveUiFieldNumberScrubRange} from "./contract"
