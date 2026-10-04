import type {Zavx0zImmersiveUiFieldNumberValueSoftRange} from "@zavx0z/immersive-ui-field-number-value-soft-range"
type NumberRange = Zavx0zImmersiveUiFieldNumberValueSoftRange.Output

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
