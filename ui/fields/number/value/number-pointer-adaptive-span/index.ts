/**
Обработка number-pointer-adaptive-span.
Реализация и её контракт принадлежат этому пакету; потребители используют его публичный вход.

@packageDocumentation
*/
import type {NumberPointerAdaptiveSpanInput} from "./contract/input"
import type {NumberValueOptions} from "@ui-fields-number-value/normalize-number-value"
import numberPointerStep from "@ui-fields-number-value/number-pointer-step"

export default function numberPointerAdaptiveSpan(options: NumberPointerAdaptiveSpanInput[0]): number {
  return 20_000 * Math.min(numberPointerStep(options), 0.1)
}

export type {NumberPointerAdaptiveSpanInput} from "./contract/input"
