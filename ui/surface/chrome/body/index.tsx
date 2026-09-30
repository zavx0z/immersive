/**
Сохраняемая область содержимого поверхности.
Реализация и её контракт принадлежат этому пакету; потребители используют его публичный вход.

@packageDocumentation
*/
import type {SurfaceBodyProps} from "./contract/input.ts"

export type {SurfaceBodyProps} from "./contract/input"

import type {JSX} from "@jsx-compiler/session"

export default function SurfaceBody(props: SurfaceBodyProps): JSX.Element<{default?: readonly (JSX.Element | string | number | bigint | null | undefined)[]}> {
  return <section
    id={props.id}
    hidden={props.hidden === true}
    style={css`
      box-sizing: border-box;
      display: block;
      flex-grow: 1;
      padding: 6px;

      ${props.style}
    `}
  >
    <slot />
  </section>
}
