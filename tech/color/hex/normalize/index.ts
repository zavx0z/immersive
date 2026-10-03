/**
Приводит проверенную HEX-строку к нижнему регистру и раскрывает трёхзначную запись.
Реализация и её контракт принадлежат этому пакету; потребители используют его публичный вход.

@packageDocumentation
*/
import type {UiViewsCodeEditorNormalizeHexColor as Contract} from "./contract"

export default function normalizeHexColor(value: Contract.Input[0]): Contract.Output {
  const body = value.trim().slice(1).toLowerCase()
  if (body.length !== 3) return `#${body}`
  return `#${body.split("").map(character => character + character).join("")}`
}

export type {UiViewsCodeEditorNormalizeHexColor} from "./contract"
