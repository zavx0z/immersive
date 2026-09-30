/**
Область действий поверхности с доступным названием.
Реализация и её контракт принадлежат этому пакету; потребители используют его публичный вход.

@packageDocumentation
*/
import type {SurfaceNavigationProps} from "./contract/input.ts"

export type {SurfaceNavigationProps} from "./contract/input"

import type {JSX} from "@jsx-compiler/session"

export default function SurfaceNavigation(props: SurfaceNavigationProps): JSX.Element<{default?: readonly (JSX.Element | string | number | bigint | null | undefined)[]}> {
  return <nav
    aria-label={props.label}
    style={css`
      display: flex;
      flex-direction: row;
      gap: 4px;

      ${props.style}
    `}
  >
    <slot />
  </nav>
}
