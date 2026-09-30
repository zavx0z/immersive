/**
Обработка number-fill-percentage.
Реализация и её контракт принадлежат этому пакету; потребители используют его публичный вход.

@packageDocumentation
*/
import type {NumberFillPercentageInput} from "./contract/input"

export default function numberFillPercentage(
  value: NumberFillPercentageInput[0],
  minimum: NumberFillPercentageInput[1],
  maximum: NumberFillPercentageInput[2]
): number | null {
  if (!Number.isFinite(value) || !Number.isFinite(minimum) || !Number.isFinite(maximum) || maximum! <= minimum!) {
    return null
  }
  return Math.min(100, Math.max(0, (value - minimum!) / (maximum! - minimum!) * 100))
}

export type {NumberFillPercentageInput} from "./contract/input"
