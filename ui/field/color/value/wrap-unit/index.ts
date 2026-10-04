/**
Периодически приводит конечное значение к диапазону от 0 включительно до 1; неконечное заменяет нулём.
Реализация и её контракт принадлежат этому пакету; потребители используют его публичный вход.

@packageDocumentation
*/
import type {ImmersiveUiFieldColorValueWrapUnit as Contract} from "./contract"

export default function wrapUnit(value: Contract.Input[0]): Contract.Output {
  if (!Number.isFinite(value)) return 0
  return ((value % 1) + 1) % 1
}

export type {ImmersiveUiFieldColorValueWrapUnit} from "./contract"
