/**
Изменение при перетаскивании числового значения.
Реализация и её контракт принадлежат этому пакету; потребители используют его публичный вход.

@packageDocumentation
*/
import type {ImmersiveUiFieldNumberScrubValue as Contract} from "./contract"
import resolveNumberDragRange from "@zavx0z/immersive-ui-field-number-scrub-range"
import scrubNumberRawValue from "@zavx0z/immersive-ui-field-number-scrub-raw"
import snapNumberValue from "@zavx0z/immersive-ui-field-number-scrub-snap"
import normalizeNumberValue from "@zavx0z/immersive-ui-field-number-value-normalize"
import type {ImmersiveUiFieldNumberValueNormalize} from "@zavx0z/immersive-ui-field-number-value-normalize"
type NumberValueOptions = NonNullable<ImmersiveUiFieldNumberValueNormalize.Input[1]>

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

export type {ImmersiveUiFieldNumberScrubValue} from "./contract"
