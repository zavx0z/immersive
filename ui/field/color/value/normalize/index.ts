/**
Нормализует частичный RGBA-цвет и возвращает неизменяемые каналы от 0 до 1.
Реализация и её контракт принадлежат этому пакету; потребители используют его публичный вход.

@packageDocumentation
*/
import type {Zavx0zImmersiveUiFieldColorValueNormalize as Contract} from "./contract"
export type {Zavx0zImmersiveUiFieldColorValueNormalize} from "./contract"

import clampUnit from "@zavx0z/immersive-ui-field-color-value-clamp-unit"


export default function normalizeColorValue(value: Contract.Input[0]): Contract.Output {
  return Object.freeze({
    r: clampUnit(value.r ?? 0),
    g: clampUnit(value.g ?? 0),
    b: clampUnit(value.b ?? 0),
    a: clampUnit(value.a ?? 1)
  })
}
