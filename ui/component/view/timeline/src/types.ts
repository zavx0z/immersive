import type {ImmersiveUiComponentViewTimeline} from "../contract"
import type {TimelineKeyframe, TimelineMarker} from "../contract/types"
type TimelineProps = ImmersiveUiComponentViewTimeline.Input

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
