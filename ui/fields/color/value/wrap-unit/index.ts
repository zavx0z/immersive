/**
Обработка wrap-unit.
Реализация и её контракт принадлежат этому пакету; потребители используют его публичный вход.

@packageDocumentation
*/
import type {WrapUnitInput} from "./contract/input"

export default function wrapUnit(value: WrapUnitInput[0]): number {
  if (!Number.isFinite(value)) return 0
  return ((value % 1) + 1) % 1
}

export type {WrapUnitInput} from "./contract/input"
