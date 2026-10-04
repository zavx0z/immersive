/**
Определяет адаптивный диапазон указателя по ограниченному сверху шагу числа.
Реализация и её контракт принадлежат этому пакету; потребители используют его публичный вход.

@packageDocumentation
*/
import type {ImmersiveUiFieldNumberValuePointerAdaptiveSpan as Contract} from "./contract"
import type {ImmersiveUiFieldNumberValueNormalize} from "@immersive-ui-field-number-value/normalize"
type NumberValueOptions = NonNullable<ImmersiveUiFieldNumberValueNormalize.Input[1]>
import numberPointerStep from "@immersive-ui-field-number-value/pointer-step"

export default function numberPointerAdaptiveSpan(options: Contract.Input[0]): Contract.Output {
  return 20_000 * Math.min(numberPointerStep(options), 0.1)
}

export type {ImmersiveUiFieldNumberValuePointerAdaptiveSpan} from "./contract"
