/**
Переводит тон HSVA в целые градусы, остальные каналы округляет до шести десятичных знаков.
Реализация и её контракт принадлежат этому пакету; потребители используют его публичный вход.

@packageDocumentation
*/
import type {Zavx0zImmersiveUiFieldColorValueChannelDisplay as Contract} from "./contract"

export default function colorChannelDisplayValue(channel: Contract.Input[0], value: Contract.Input[1]): Contract.Output {
  return channel === "h"
    ? Math.round(value.h * 360)
    : Math.round(value[channel] * 1_000_000) / 1_000_000
}

export type {Zavx0zImmersiveUiFieldColorValueChannelDisplay} from "./contract"
