/**
Временная шкала дорожек, ключевых кадров и маркеров.
Реализация и её контракт принадлежат этому пакету; потребители используют его публичный вход.

@packageDocumentation
*/
import {TimelineBody} from "./src/helpers.tsx"
import {TimelineOutput} from "./src/helpers.tsx"
import type {UiViewsTimeline as Contract} from "./contract"
import {normalizeTimelineProps} from "./src/helpers.tsx"
import SurfaceHeader from "@ui-surfaces-chrome/header"
import SurfaceOwner from "@ui-surfaces-chrome/owner"
import SurfaceTitle from "@ui-surfaces-chrome/title"

export type {UiViewsTimeline} from "./contract"


export default function Timeline(props: Contract.Input): Contract.Output {
  const model = normalizeTimelineProps(props)
  return <SurfaceOwner
    label={props.title}
    timeline
    frameStart={model.frameStart}
    frameEnd={model.frameEnd}
    frameCurrent={model.frameCurrent}
    style={css`
      width: 640px;
      min-height: 140px;

      ${props.style}
    `}
  >
    <SurfaceHeader key="header">
      <SurfaceTitle key="title" text={props.title} />
      <TimelineOutput key="output" model={model} />
    </SurfaceHeader>
    <TimelineBody
      key="body"
      model={model}
      onKeyframeActivate={props.onKeyframeActivate}
      onMarkerActivate={props.onMarkerActivate}
      onSceneMarkerActivate={props.onSceneMarkerActivate}
    />
  </SurfaceOwner>
}
