/**
Тип TimelineKeyframe принадлежит контракту своего владельца.
*/
export type TimelineKeyframe = Readonly<{
  key: string
  frame: number
  label: string
  selected?: boolean | undefined
}>

/**
Тип TimelineMarker принадлежит контракту своего владельца.
*/
export type TimelineMarker = Readonly<{
  key: string
  label: string
  selected?: boolean | undefined
  frame?: number | undefined
  /** @deprecated Legacy multi-track input; use frame for scene markers. */
  tick?: number | undefined
}>

/** @deprecated Multiple labelled rows belong to a separate multi-channel owner. */
export type TimelineTrack = Readonly<{
  key: string
  label: string
  markers: readonly TimelineMarker[]
}>
