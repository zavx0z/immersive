/**
Сохраняет конечную числовую границу либо возвращает переданное запасное значение.
Реализация и её контракт принадлежат этому пакету; потребители используют его публичный вход.

@packageDocumentation
*/
import type {Zavx0zImmersiveUiFieldNumberValueFiniteBound as Contract} from "./contract"

export default function finiteBound(value: Contract.Input[0], fallback: Contract.Input[1]): Contract.Output {
  return Number.isFinite(value) ? value! : fallback
}

export type {Zavx0zImmersiveUiFieldNumberValueFiniteBound} from "./contract"
