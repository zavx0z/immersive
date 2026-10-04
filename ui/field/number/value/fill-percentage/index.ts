/**
Обработка number-fill-percentage.
Реализация и её контракт принадлежат этому пакету; потребители используют его публичный вход.

@packageDocumentation
*/
import type {ImmersiveUiFieldNumberValueFillPercentage as Contract} from "./contract"

export default function numberFillPercentage(
  value: Contract.Input[0],
  minimum: Contract.Input[1],
  maximum: Contract.Input[2]
): Contract.Output {
  if (!Number.isFinite(value) || !Number.isFinite(minimum) || !Number.isFinite(maximum) || maximum! <= minimum!) {
    return null
  }
  return Math.min(100, Math.max(0, (value - minimum!) / (maximum! - minimum!) * 100))
}

export type {ImmersiveUiFieldNumberValueFillPercentage} from "./contract"
