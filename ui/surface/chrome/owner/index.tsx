/**
Общая поверхность составного компонента с рамкой и состоянием активности.
Реализация и её контракт принадлежат этому пакету; потребители используют его публичный вход.

@packageDocumentation
*/
import type {SurfaceOwnerProps} from "./contract/input.ts"

export type {SurfaceOwnerProps} from "./contract/input"

import type {JSX} from "@jsx-compiler/session"

export default function SurfaceOwner(props: SurfaceOwnerProps): JSX.Element<{default?: readonly (JSX.Element | string | number | bigint | null | undefined)[]}> {
  return <section
    aria-label={props.label}
    data-active={props.active === true ? "true" : undefined}
    data-timeline={props.timeline === true ? "" : undefined}
    data-frame-start={props.frameStart === undefined ? undefined : String(props.frameStart)}
    data-frame-end={props.frameEnd === undefined ? undefined : String(props.frameEnd)}
    data-frame-current={props.frameCurrent === undefined ? undefined : String(props.frameCurrent)}
    style={css`
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      position: relative;
      border: var(--border-width-control) solid var(--widget-toolbar-outline);
      border-radius: 6px;
      background: var(--space-node-navigation-background);
      color: var(--widget-toolbar-content);
      overflow: clip;

      &[data-active="true"] {
        border-color: var(--material-editor-outline-active);
      }

      ${props.style}
    `}
  >
    <slot />
  </section>
}
