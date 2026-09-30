import type {TimelineProps} from "./input.ts"

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

/**
Тип NormalizedTimelineKeyframe принадлежит контракту своего владельца.
*/
export type NormalizedTimelineKeyframe = TimelineKeyframe & Readonly<{trackKey?: string | undefined}>

/**
Тип TimelineModel принадлежит контракту своего владельца.
*/
export type TimelineModel = Readonly<{
  frameStart: number
  frameEnd: number
  frameCurrent: number
  visibleStart: number
  visibleEnd: number
  previewStart: number | null
  previewEnd: number | null
  showSeconds: boolean
  framesPerSecond: number
  keyframes: readonly NormalizedTimelineKeyframe[]
  markers: readonly TimelineMarker[]
}>

/**
Тип TimelineKeyframeViewProps принадлежит контракту своего владельца.
*/
export type TimelineKeyframeViewProps = Readonly<{
  item: NormalizedTimelineKeyframe
  visibleStart: number
  visibleEnd: number
  onActivate?: TimelineProps["onKeyframeActivate"]
  onLegacyActivate?: TimelineProps["onMarkerActivate"]
}>

/**
Тип TimelineMarkerViewProps принадлежит контракту своего владельца.
*/
export type TimelineMarkerViewProps = Readonly<{
  marker: TimelineMarker
  visibleStart: number
  visibleEnd: number
  onActivate?: TimelineProps["onSceneMarkerActivate"]
}>

/**
Тип TimelineBodyProps принадлежит контракту своего владельца.
*/
export type TimelineBodyProps = Readonly<{
  model: TimelineModel
  onKeyframeActivate?: TimelineProps["onKeyframeActivate"]
  onMarkerActivate?: TimelineProps["onMarkerActivate"]
  onSceneMarkerActivate?: TimelineProps["onSceneMarkerActivate"]
}>
