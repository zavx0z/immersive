/**
Обработка is-hex-color.
Реализация и её контракт принадлежат этому пакету; потребители используют его публичный вход.

@packageDocumentation
*/
import type {IsHexColorInput} from "./contract/input"

export default function isHexColor(value: IsHexColorInput[0]): boolean {
  return /^#(?:[0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/iu.test(value.trim())
}

export type {IsHexColorInput} from "./contract/input"
