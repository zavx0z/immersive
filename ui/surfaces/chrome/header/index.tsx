/**
Шапка поверхности с безымянным слотом содержимого.
Реализация и её контракт принадлежат этому пакету; потребители используют его публичный вход.

@packageDocumentation
*/
import type {SurfaceHeaderProps} from "./contract/input.ts"

export type {SurfaceHeaderProps} from "./contract/input"

import type {JSX} from "@jsx-compiler/session"

export default function SurfaceHeader(props: SurfaceHeaderProps): JSX.Element<{default?: readonly (JSX.Element | string | number | bigint | null | undefined)[]}> {
  return <header
    style={css`
      box-sizing: border-box;
      display: flex;
      flex-direction: row;
      align-items: center;
      height: 28px;
      gap: 4px;
      padding: 3px 6px;
      background: var(--space-node-header-background);

      ${props.style}
    `}
  >
    <slot />
  </header>
}
