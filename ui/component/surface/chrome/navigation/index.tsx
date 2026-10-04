/**
Область действий поверхности с доступным названием.
Реализация и её контракт принадлежат этому пакету; потребители используют его публичный вход.

@packageDocumentation
*/
import type {ImmersiveUiComponentSurfaceChromeNavigation as Contract} from "./contract"

export type {ImmersiveUiComponentSurfaceChromeNavigation} from "./contract"


export default function SurfaceNavigation(props: Contract.Input): Contract.Output {
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
