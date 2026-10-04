/**
Определяет адаптивный диапазон указателя по ограниченному сверху шагу числа.
Реализация и её контракт принадлежат этому пакету; потребители используют его публичный вход.

@packageDocumentation
*/
import type {Zavx0zImmersiveUiFieldNumberValuePointerAdaptiveSpan as Contract} from "./contract"
import type {Zavx0zImmersiveUiFieldNumberValueNormalize} from "@zavx0z/immersive-ui-field-number-value-normalize"
type NumberValueOptions = NonNullable<Zavx0zImmersiveUiFieldNumberValueNormalize.Input[1]>
import numberPointerStep from "@zavx0z/immersive-ui-field-number-value-pointer-step"

export default function numberPointerAdaptiveSpan(options: Contract.Input[0]): Contract.Output {
  return 20_000 * Math.min(numberPointerStep(options), 0.1)
}

export type {Zavx0zImmersiveUiFieldNumberValuePointerAdaptiveSpan} from "./contract"
