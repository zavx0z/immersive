/**
Определяет адаптивный диапазон указателя по ограниченному сверху шагу числа.
Реализация и её контракт принадлежат этому пакету; потребители используют его публичный вход.

@packageDocumentation
*/
import type {UiFieldsNumberValueNumberPointerAdaptiveSpan as Contract} from "./contract"
import type {NumberValueOptions} from "@ui-fields-number-value/normalize-number-value"
import numberPointerStep from "@ui-fields-number-value/number-pointer-step"

export default function numberPointerAdaptiveSpan(options: Contract.Input[0]): Contract.Output {
  return 20_000 * Math.min(numberPointerStep(options), 0.1)
}

export type {UiFieldsNumberValueNumberPointerAdaptiveSpan} from "./contract"
