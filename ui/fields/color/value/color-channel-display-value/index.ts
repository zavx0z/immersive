/**
Обработка color-channel-display-value.
Реализация и её контракт принадлежат этому пакету; потребители используют его публичный вход.

@packageDocumentation
*/
import type {ColorChannelDisplayValueInput} from "./contract/input"
import type {ColorHsva} from "@ui-fields-color-value/normalize-color-value"

export default function colorChannelDisplayValue(channel: ColorChannelDisplayValueInput[0], value: ColorChannelDisplayValueInput[1]): number {
  return channel === "h"
    ? Math.round(value.h * 360)
    : Math.round(value[channel] * 1_000_000) / 1_000_000
}

export type {ColorChannelDisplayValueInput} from "./contract/input"
