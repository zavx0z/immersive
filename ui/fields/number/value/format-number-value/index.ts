/**
Представление числового значения.
Реализация и её контракт принадлежат этому пакету; потребители используют его публичный вход.

@packageDocumentation
*/
import type {FormatNumberValueInput} from "./contract/input"



export default function formatNumberValue(value: FormatNumberValueInput[0], precision: FormatNumberValueInput[1]): number | string {
  if (precision === undefined) return value
  if (!Number.isInteger(precision) || precision < 0 || precision > 20) {
    throw new RangeError("NumberField precision must be an integer from 0 to 20")
  }
  return value.toFixed(precision)
}

export type {FormatNumberValueInput} from "./contract/input"
