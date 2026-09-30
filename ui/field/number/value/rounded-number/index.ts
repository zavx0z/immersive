/**
Обработка rounded-number.
Реализация и её контракт принадлежат этому пакету; потребители используют его публичный вход.

@packageDocumentation
*/
import type {RoundedNumberInput} from "./contract/input"

export default function roundedNumber(value: RoundedNumberInput[0]): number {
  return Math.round(value * 1_000_000) / 1_000_000
}

export type {RoundedNumberInput} from "./contract/input"
