/**
Выбирает допустимый шаг числового указателя, используя 0.1 при отсутствии корректного шага.
Реализация и её контракт принадлежат этому пакету; потребители используют его публичный вход.

@packageDocumentation
*/
import type {ImmersiveUiFieldNumberValueStepPointer as Contract} from "./contract"
import validNumberStep from "@zavx0z/immersive-ui-field-number-value-step-valid"

export default function numberPointerStep(options: Contract.Input[0]): Contract.Output {
  return validNumberStep(options.step) ?? 0.1
}

export type {ImmersiveUiFieldNumberValueStepPointer} from "./contract"
