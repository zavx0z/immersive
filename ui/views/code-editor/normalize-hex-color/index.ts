/**
Нормализация hex-color.
Реализация и её контракт принадлежат этому пакету; потребители используют его публичный вход.

@packageDocumentation
*/
import type {NormalizeHexColorInput} from "./contract/input"

export default function normalizeHexColor(value: NormalizeHexColorInput[0]): string {
  const body = value.trim().slice(1).toLowerCase()
  if (body.length !== 3) return `#${body}`
  return `#${body.split("").map(character => character + character).join("")}`
}

export type {NormalizeHexColorInput} from "./contract/input"
