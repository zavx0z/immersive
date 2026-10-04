/**
Проверяет HEX-цвет из трёх, шести или восьми цифр с необязательными внешними пробелами.
Реализация и её контракт принадлежат этому пакету; потребители используют его публичный вход.

@packageDocumentation
*/
import type {Zavx0zImmersiveTechColorHexValid as Contract} from "./contract"

export default function isHexColor(value: Contract.Input[0]): Contract.Output {
  return /^#(?:[0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/iu.test(value.trim())
}

export type {Zavx0zImmersiveTechColorHexValid} from "./contract"
