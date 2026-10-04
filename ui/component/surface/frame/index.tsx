/**
Рамка рабочей области с заголовком и элементами управления.
Реализация и её контракт принадлежат этому пакету; потребители используют его публичный вход.

@packageDocumentation
*/
import {FrameEdgeIndicator} from "./src/helpers.tsx"
import {FrameHandleButton} from "./src/helpers.tsx"
import type {ImmersiveUiComponentSurfaceFrame as Contract} from "./contract"
import {assertEdge} from "./src/helpers.tsx"
import assertSurfaceActions from "@immersive-ui-surface/assert-actions"
import SurfaceBody from "@immersive-ui-component-surface-chrome/body"
import SurfaceHeader from "@immersive-ui-component-surface-chrome/header"
import SurfaceNavigation from "@immersive-ui-component-surface-chrome/navigation"
import SurfaceOwner from "@immersive-ui-component-surface-chrome/owner"
import SurfaceTitle from "@immersive-ui-component-surface-chrome/title"

export type {ImmersiveUiComponentSurfaceFrame} from "./contract"


export default function Frame(props: Contract.Input): Contract.Output {
  if (typeof props.title !== "string") throw new TypeError("Frame title must be a string")
  assertEdge(props.edge)
  assertSurfaceActions(props.handles, "Frame handle")
  return <SurfaceOwner
    label={props.title}
    style={css`
      width: 300px;
      min-height: 140px;

      ${props.style}
    `}
  >
    <FrameEdgeIndicator key="edge" edge={props.edge} />
    <SurfaceHeader key="header">
      <SurfaceTitle key="title" text={props.title} />
      <SurfaceNavigation key="navigation" label="Frame handles">
        {props.handles.map(handle => <FrameHandleButton
          key={handle.key}
          handle={handle}
          onHandle={props.onHandle}
        />)}
      </SurfaceNavigation>
    </SurfaceHeader>
    <SurfaceBody key="body">
      <slot />
    </SurfaceBody>
  </SurfaceOwner>
}
