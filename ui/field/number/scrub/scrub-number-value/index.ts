/**
Изменение при перетаскивании числового значения.
Реализация и её контракт принадлежат этому пакету; потребители используют его публичный вход.

@packageDocumentation
*/
import type {ScrubNumberValueInput} from "./contract/input"
import resolveNumberDragRange from "@ui-fields-number-scrub/resolve-number-drag-range"
import scrubNumberRawValue from "@ui-fields-number-scrub/scrub-number-raw-value"
import snapNumberValue from "@ui-fields-number-scrub/snap-number-value"
import normalizeNumberValue from "@ui-fields-number-value/normalize-number-value"
import type {NumberValueOptions} from "@ui-fields-number-value/normalize-number-value"

export default function scrubNumberValue(
  value: ScrubNumberValueInput[0],
  deltaX: ScrubNumberValueInput[1],
  distanceX: ScrubNumberValueInput[2],
  options: ScrubNumberValueInput[3] = {},
  shift: ScrubNumberValueInput[4] = false,
  ctrl: ScrubNumberValueInput[5] = false
): number {
  const range = resolveNumberDragRange(value, options)
  const raw = scrubNumberRawValue(value, deltaX, distanceX, range, shift)
  const candidate = ctrl ? snapNumberValue(raw, range, shift) : raw
  return normalizeNumberValue(candidate, options)
}

export type {ScrubNumberValueInput} from "./contract/input"
