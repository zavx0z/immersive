/**
Обработка finite-bound.
Реализация и её контракт принадлежат этому пакету; потребители используют его публичный вход.

@packageDocumentation
*/
import type {FiniteBoundInput} from "./contract/input"

export default function finiteBound(value: FiniteBoundInput[0], fallback: FiniteBoundInput[1]): number {
  return Number.isFinite(value) ? value! : fallback
}

export type {FiniteBoundInput} from "./contract/input"
