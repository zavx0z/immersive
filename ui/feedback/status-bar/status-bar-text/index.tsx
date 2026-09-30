/**
Текстовое представление областей строки состояния.
Реализация и её контракт принадлежат этому пакету; потребители используют его публичный вход.

@packageDocumentation
*/
import type {StatusBarItem} from "@ui-feedback/status-bar"

export default function statusBarText(items: readonly StatusBarItem[], separator = " | "): string {
  return items.map(item => item.text).join(separator)
}
