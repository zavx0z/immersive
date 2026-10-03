/**
Изменение при перетаскивании числового значения.
Реализация и её контракт принадлежат этому пакету; потребители используют его публичный вход.

@packageDocumentation
*/
import type {UiFieldsNumberScrubScrubNumberValue as Contract} from "./contract"
import resolveNumberDragRange from "@ui-fields-number-scrub/resolve-number-drag-range"
import scrubNumberRawValue from "@ui-fields-number-scrub/scrub-number-raw-value"
import snapNumberValue from "@ui-fields-number-scrub/snap-number-value"
import normalizeNumberValue from "@ui-fields-number-value/normalize-number-value"
import type {UiFieldsNumberValueNormalizeNumberValue} from "@ui-fields-number-value/normalize-number-value"
type NumberValueOptions = NonNullable<UiFieldsNumberValueNormalizeNumberValue.Input[1]>

export default function scrubNumberValue(
  value: Contract.Input[0],
  deltaX: Contract.Input[1],
  distanceX: Contract.Input[2],
  options: Contract.Input[3] = {},
  shift: Contract.Input[4] = false,
  ctrl: Contract.Input[5] = false
): Contract.Output {
  const range = resolveNumberDragRange(value, options)
  const raw = scrubNumberRawValue(value, deltaX, distanceX, range, shift)
  const candidate = ctrl ? snapNumberValue(raw, range, shift) : raw
  return normalizeNumberValue(candidate, options)
}

export type {UiFieldsNumberScrubScrubNumberValue} from "./contract"
