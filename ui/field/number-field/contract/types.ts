import type {NumberRange} from "@ui-fields-number-value/resolve-number-soft-range"

/**
Тип ActiveScrub принадлежит контракту своего владельца.
*/
export type ActiveScrub = Readonly<{
  target: HTMLInputElement
  pointerId: number
  origin: number
  current: number
  rawCurrent: number
  startX: number
  lastX: number
  changed: boolean
  dragRange: NumberRange
}>
