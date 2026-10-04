/**
Текстовое представление областей строки состояния.
Реализация и её контракт принадлежат этому пакету; потребители используют его публичный вход.

@packageDocumentation
*/
import type {ImmersiveUiFeedbackStatusBarText as Contract} from "./contract"

export default function statusBarText(items: Contract.Input[0], separator: Contract.Input[1] = " | "): Contract.Output {
  return items.map(item => item.text).join(separator)
}
export type {ImmersiveUiFeedbackStatusBarText} from "./contract"
