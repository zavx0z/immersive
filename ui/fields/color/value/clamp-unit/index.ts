/**
Обработка clamp-unit.
Реализация и её контракт принадлежат этому пакету; потребители используют его публичный вход.

@packageDocumentation
*/
import type {ClampUnitInput} from "./contract/input"

export default function clampUnit(value: ClampUnitInput[0]): number {
  return Math.min(1, Math.max(0, Number.isFinite(value) ? value : 0))
}

export type {ClampUnitInput} from "./contract/input"
