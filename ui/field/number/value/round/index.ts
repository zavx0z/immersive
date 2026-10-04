/**
Округляет число до шести знаков после десятичной точки.
Реализация и её контракт принадлежат этому пакету; потребители используют его публичный вход.

@packageDocumentation
*/
import type {ImmersiveUiFieldNumberValueRound as Contract} from "./contract"

export default function roundedNumber(value: Contract.Input[0]): Contract.Output {
  return Math.round(value * 1_000_000) / 1_000_000
}

export type {ImmersiveUiFieldNumberValueRound} from "./contract"
