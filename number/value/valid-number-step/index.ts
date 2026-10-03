/**
Обработка valid-number-step.
Реализация и её контракт принадлежат этому пакету; потребители используют его публичный вход.

@packageDocumentation
*/
import type {ValidNumberStepInput} from "./contract/input"

export default function validNumberStep(value: ValidNumberStepInput[0]): number | undefined {
  return Number.isFinite(value) && value! > 0 ? value : undefined
}

export type {ValidNumberStepInput} from "./contract/input"
