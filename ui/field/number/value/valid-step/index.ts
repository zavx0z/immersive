/**
Обработка valid-number-step.
Реализация и её контракт принадлежат этому пакету; потребители используют его публичный вход.

@packageDocumentation
*/
import type {UiFieldsNumberValueValidNumberStep as Contract} from "./contract"

export default function validNumberStep(value: Contract.Input[0]): Contract.Output {
  return Number.isFinite(value) && value! > 0 ? value : undefined
}

export type {UiFieldsNumberValueValidNumberStep} from "./contract"
