/**
Обработка number-pointer-step.
Реализация и её контракт принадлежат этому пакету; потребители используют его публичный вход.

@packageDocumentation
*/
import type {NumberPointerStepInput} from "./contract/input"
import type {NumberValueOptions} from "@ui-fields-number-value/normalize-number-value"
import validNumberStep from "@ui-fields-number-value/valid-number-step"

export default function numberPointerStep(options: NumberPointerStepInput[0]): number {
  return validNumberStep(options.step) ?? 0.1
}

export type {NumberPointerStepInput} from "./contract/input"
