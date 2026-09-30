import type {TimelineKeyframe} from "./types.ts"
import type {TimelineMarker} from "./types.ts"
import type {TimelineTrack} from "./types.ts"

/**
Входные данные Timeline.
*/
export interface TimelineProps {
  readonly title: string
  readonly frameStart?: number | undefined
  readonly frameEnd?: number | undefined
  readonly frameCurrent?: number | undefined
  readonly visibleStart?: number | undefined
  readonly visibleEnd?: number | undefined
  readonly previewStart?: number | undefined
  readonly previewEnd?: number | undefined
  readonly showSeconds?: boolean | undefined
  readonly framesPerSecond?: number | undefined
  readonly keyframes?: readonly TimelineKeyframe[] | undefined
  readonly markers?: readonly TimelineMarker[] | undefined
  /** @deprecated Use frameStart. */
  readonly min?: number | undefined
  /** @deprecated Use frameEnd. */
  readonly max?: number | undefined
  /** @deprecated Use frameCurrent. */
  readonly current?: number | undefined
  /** @deprecated Playback state belongs to a separate controller. */
  readonly playing?: boolean | undefined
  /** @deprecated Multiple labelled rows belong to a separate multi-channel owner. */
  readonly tracks?: readonly TimelineTrack[] | undefined
  readonly style?: CssStyle | undefined
  readonly onKeyframeActivate?: ((key: string, event: Event) => void) | undefined
  readonly onSceneMarkerActivate?: ((key: string, event: Event) => void) | undefined
  /** @deprecated Legacy track callback retained only for migration. */
  readonly onMarkerActivate?: ((trackKey: string, markerKey: string, event: Event) => void) | undefined
  /** @deprecated Playback commands belong to a separate controller. */
  readonly onPrevious?: ((event: Event) => void) | undefined
  /** @deprecated Playback commands belong to a separate controller. */
  readonly onPlayingChange?: ((playing: boolean, event: Event) => void) | undefined
  /** @deprecated Playback commands belong to a separate controller. */
  readonly onNext?: ((event: Event) => void) | undefined
}
