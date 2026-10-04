/**
Переводит движение указателя в ограниченное диапазоном число с замедлением при Shift.
Реализация и её контракт принадлежат этому пакету; потребители используют его публичный вход.

@packageDocumentation
*/
import type {ImmersiveUiFieldNumberScrubRaw as Contract} from "./contract"
import type {ImmersiveUiFieldNumberValueSoftRange} from "@zavx0z/immersive-ui-field-number-value-soft-range"
type NumberRange = ImmersiveUiFieldNumberValueSoftRange.Output

export default function scrubNumberRawValue(
  value: Contract.Input[0],
  deltaX: Contract.Input[1],
  distanceX: Contract.Input[2],
  range: Contract.Input[3],
  shift: Contract.Input[4]
): Contract.Output {
  const softSpan = range.max - range.min
  if (softSpan <= 0 || !Number.isFinite(deltaX) || !Number.isFinite(distanceX)) {
    return Math.min(range.max, Math.max(range.min, value))
  }
  let scale = softSpan > 11 ? Math.abs(distanceX) / 500 : 1
  if (shift) scale /= 10
  return Math.min(range.max, Math.max(range.min, value + (deltaX / 500) * scale * softSpan))
}

export type {ImmersiveUiFieldNumberScrubRaw} from "./contract"
