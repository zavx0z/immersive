/**
Выбирает допустимый шаг числового указателя, используя 0.1 при отсутствии корректного шага.
Реализация и её контракт принадлежат этому пакету; потребители используют его публичный вход.

@packageDocumentation
*/
import type {UiFieldsNumberValueNumberPointerStep as Contract} from "./contract"
import type {UiFieldsNumberValueNormalizeNumberValue} from "@ui-fields-number-value/normalize-number-value"
type NumberValueOptions = NonNullable<UiFieldsNumberValueNormalizeNumberValue.Input[1]>
import validNumberStep from "@ui-fields-number-value/valid-number-step"

export default function numberPointerStep(options: Contract.Input[0]): Contract.Output {
  return validNumberStep(options.step) ?? 0.1
}

export type {UiFieldsNumberValueNumberPointerStep} from "./contract"
