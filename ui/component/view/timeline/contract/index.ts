import type {ImmersiveUiComponentView} from "@zavx0z/immersive-ui-component-view/contract"
import type {TimelineKeyframe} from "./types.ts"
import type {TimelineMarker} from "./types.ts"
import type {TimelineTrack} from "./types.ts"

import type {JSX} from "@zavx0z/immersive-jsx-compiler-session"

/** Протокол временной шкалы, кадров и маркеров с внешними действиями. */
export declare namespace ImmersiveUiComponentViewTimeline {
  /**
  Входные данные Timeline.
  */
  interface Input {
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
    /** @deprecated Используйте frameStart. */
    readonly min?: number | undefined
    /** @deprecated Используйте frameEnd. */
    readonly max?: number | undefined
    /** @deprecated Используйте frameCurrent. */
    readonly current?: number | undefined
    /** @deprecated Состояние воспроизведения принадлежит отдельному контроллеру. */
    readonly playing?: boolean | undefined
    /** @deprecated Несколько именованных дорожек принадлежат отдельному владельцу. */
    readonly tracks?: readonly TimelineTrack[] | undefined
    readonly style?: CssStyle | undefined
    readonly onKeyframeActivate?: ((key: string, event: Event) => void) | undefined
    readonly onSceneMarkerActivate?: ((key: string, event: Event) => void) | undefined
    /** @deprecated Прежний callback дорожки сохранён на время миграции. */
    readonly onMarkerActivate?: ((trackKey: string, markerKey: string, event: Event) => void) | undefined
    /** @deprecated Команды воспроизведения принадлежат отдельному контроллеру. */
    readonly onPrevious?: ((event: Event) => void) | undefined
    /** @deprecated Команды воспроизведения принадлежат отдельному контроллеру. */
    readonly onPlayingChange?: ((playing: boolean, event: Event) => void) | undefined
    /** @deprecated Команды воспроизведения принадлежат отдельному контроллеру. */
    readonly onNext?: ((event: Event) => void) | undefined
  }

  type Output = ImmersiveUiComponentView.Output & JSX.Element
}
