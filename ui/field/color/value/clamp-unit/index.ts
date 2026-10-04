/**
Ограничивает значение диапазоном от 0 до 1; неконечное значение заменяет нулём.
Реализация и её контракт принадлежат этому пакету; потребители используют его публичный вход.

@packageDocumentation
*/
import type {ImmersiveUiFieldColorValueClampUnit as Contract} from "./contract"

export default function clampUnit(value: Contract.Input[0]): Contract.Output {
  return Math.min(1, Math.max(0, Number.isFinite(value) ? value : 0))
}

export type {ImmersiveUiFieldColorValueClampUnit} from "./contract"
