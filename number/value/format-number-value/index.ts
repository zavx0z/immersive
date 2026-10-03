/**
Представление числового значения.
Реализация и её контракт принадлежат этому пакету; потребители используют его публичный вход.

@packageDocumentation
*/
import type {UiFieldsNumberValueFormatNumberValue as Contract} from "./contract"



export default function formatNumberValue(value: Contract.Input[0], precision: Contract.Input[1]): Contract.Output {
  if (precision === undefined) return value
  if (!Number.isInteger(precision) || precision < 0 || precision > 20) {
    throw new RangeError("NumberField precision must be an integer from 0 to 20")
  }
  return value.toFixed(precision)
}

export type {UiFieldsNumberValueFormatNumberValue} from "./contract"
